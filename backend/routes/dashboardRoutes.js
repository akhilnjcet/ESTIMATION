const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Program = require('../models/Program');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/combined
// @desc    Get aggregated data across all programs
router.get('/combined', protect, async (req, res) => {
  try {
    let programIds = [];
    if (req.user.role === 'admin') {
      const programs = await Program.find({ owner: req.user._id });
      programIds = programs.map(p => p._id);
    } else {
      programIds = req.user.programAccess || [];
    }

    // Fallback if user has no programs yet
    if (programIds.length === 0) {
      const allUserPrograms = await Program.find({});
      programIds = allUserPrograms.map(p => p._id);
    }

    const Invoice = require('../models/Invoice');
    const Quotation = require('../models/Quotation');
    const LabourBill = require('../models/LabourBill');

    const [allTransactions, allInvoices, allLabourBills, allAccounts, programsInfo, invoices, quotations, labourBills] = await Promise.all([
      Transaction.find({ programId: { $in: programIds } }),
      Invoice.find({ programId: { $in: programIds } }),
      LabourBill.find({ programId: { $in: programIds } }),
      Account.find({ programId: { $in: programIds } }),
      Program.find({ _id: { $in: programIds } }, 'name'),
      Invoice.find({ programId: { $in: programIds } }).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      Quotation.find({ programId: { $in: programIds } }).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      LabourBill.find({ programId: { $in: programIds } }).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName')
    ]);

    // Process per-program and global metrics
    const programDataMap = {};
    programIds.forEach(id => {
      programDataMap[id.toString()] = { income: 0, expense: 0, balance: 0 };
    });

    let globalIncome = 0;
    let globalExpense = 0;
    let globalCash = 0;
    let globalBank = 0;
    let globalUpi = 0;

    // 1. Transactions Income & Expense
    allTransactions.forEach(t => {
      const pid = t.programId ? t.programId.toString() : null;
      if (t.type === 'Income') {
        globalIncome += (t.amount || 0);
        if (pid && programDataMap[pid]) programDataMap[pid].income += (t.amount || 0);
      }
      if (t.type === 'Expense') {
        globalExpense += (t.amount || 0);
        if (pid && programDataMap[pid]) programDataMap[pid].expense += (t.amount || 0);
      }
    });

    // 2. Tax Invoices -> Income/Sales Revenue
    allInvoices.forEach(inv => {
      const pid = inv.programId ? inv.programId.toString() : null;
      globalIncome += (inv.totalAmount || 0);
      if (pid && programDataMap[pid]) programDataMap[pid].income += (inv.totalAmount || 0);
    });

    // 3. Labour & Transport Bills -> Expenses/Logistics
    allLabourBills.forEach(bill => {
      const pid = bill.programId ? bill.programId.toString() : null;
      globalExpense += (bill.totalAmount || 0);
      if (pid && programDataMap[pid]) programDataMap[pid].expense += (bill.totalAmount || 0);
    });

    // 4. Account Balances
    allAccounts.forEach(acc => {
      const pid = acc.programId ? acc.programId.toString() : null;
      if (pid && programDataMap[pid]) programDataMap[pid].balance += (acc.balance || 0);

      if (acc.type === 'Cash') globalCash += (acc.balance || 0);
      else if (acc.type === 'Bank') globalBank += (acc.balance || 0);
      else if (acc.type === 'UPI') globalUpi += (acc.balance || 0);
    });

    // Default cash balance calculation if accounts table hasn't been set up yet
    if (globalCash === 0 && globalBank === 0 && globalUpi === 0) {
      globalCash = Math.max(0, globalIncome - globalExpense);
    }

    const globalBalance = globalIncome - globalExpense;

    const programSummaries = programsInfo.map(p => ({
      _id: p._id,
      name: p.name,
      ...programDataMap[p._id.toString()]
    }));

    // Combine recent documents
    const combinedDocs = [
      ...invoices.map(doc => ({
        _id: doc._id,
        docType: 'Invoice',
        docNumber: doc.invoiceNumber,
        partyName: doc.customer?.customerName || 'Customer',
        totalAmount: doc.totalAmount,
        createdAt: doc.createdAt,
        status: doc.status || 'PAID',
        path: '/invoices'
      })),
      ...quotations.map(doc => ({
        _id: doc._id,
        docType: 'Quotation',
        docNumber: doc.quotationNumber,
        partyName: doc.customer?.customerName || 'Customer',
        totalAmount: doc.totalAmount,
        createdAt: doc.createdAt,
        status: doc.status || 'ISSUED',
        path: '/quotations'
      })),
      ...labourBills.map(doc => ({
        _id: doc._id,
        docType: 'Labour Bill',
        docNumber: doc.billNumber,
        partyName: doc.customer?.customerName || doc.clientName || doc.serviceProviderName || 'Client',
        totalAmount: doc.totalAmount,
        createdAt: doc.createdAt,
        status: doc.status || 'ISSUED',
        path: '/labour-bills'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    const recentTransactions = await Transaction.find({ programId: { $in: programIds } })
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .populate('customer', 'customerName')
      .populate('account', 'accountName');

    res.json({
      combined: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        cashBalance: globalCash,
        bankBalance: globalBank,
        upiBalance: globalUpi
      },
      programSummaries,
      recentInvoices: invoices,
      recentQuotations: quotations,
      recentLabourBills: labourBills,
      recentDocuments: combinedDocs,
      recentTransactions
    });
  } catch (error) {
    console.error('DASHBOARD_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
