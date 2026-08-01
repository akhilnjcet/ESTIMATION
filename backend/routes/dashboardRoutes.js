const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Program = require('../models/Program');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/combined
// @desc    Get aggregated data across all programs
router.get('/combined', protect, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const Quotation = require('../models/Quotation');
    const LabourBill = require('../models/LabourBill');

    const filter = (req.programId && mongoose.Types.ObjectId.isValid(req.programId)) 
      ? { programId: req.programId } 
      : {};

    let [allTransactions, allInvoices, allLabourBills, allAccounts, programsInfo, invoices, quotations, labourBills] = await Promise.all([
      Transaction.find(filter),
      Invoice.find(filter),
      LabourBill.find(filter),
      Account.find(filter),
      Program.find({}, 'name'),
      Invoice.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      Quotation.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      LabourBill.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName')
    ]);

    // Fallback: If filtered program returned 0 entries but global DB has records, query all
    if (allAccounts.length === 0 && allTransactions.length === 0) {
      [allTransactions, allAccounts, allInvoices, allLabourBills] = await Promise.all([
        Transaction.find({}),
        Account.find({}),
        Invoice.find({}),
        LabourBill.find({})
      ]);
    }

    let globalIncome = 0;
    let globalExpense = 0;
    let globalCash = 0;
    let globalBank = 0;
    let globalUpi = 0;

    // 1. Transactions (Income / Expense)
    allTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'Income') globalIncome += amt;
      if (t.type === 'Expense') globalExpense += amt;
    });

    // 2. Fallback to Tax Invoices for Sales Revenue if no transaction records exist
    if (globalIncome === 0 && allInvoices.length > 0) {
      allInvoices.forEach(inv => {
        globalIncome += (Number(inv.totalAmount) || 0);
      });
    }

    // 3. Fallback to Labour & Transport Bills for Expenses if no transaction records exist
    if (globalExpense === 0 && allLabourBills.length > 0) {
      allLabourBills.forEach(bill => {
        globalExpense += (Number(bill.totalAmount) || 0);
      });
    }

    // 4. Accounts (Cash / Bank / UPI Balances)
    allAccounts.forEach(acc => {
      const bal = Number(acc.balance) || 0;
      const accType = (acc.type || '').toLowerCase();
      if (accType === 'cash') globalCash += bal;
      else if (accType === 'bank') globalBank += bal;
      else if (accType === 'upi') globalUpi += bal;
      else globalBank += bal;
    });

    let totalLiquidBalance = globalCash + globalBank + globalUpi;

    // 5. Fallback calculation for Liquid Balances if accounts table is uninitialized
    if (totalLiquidBalance === 0 && (globalIncome > 0 || globalExpense > 0)) {
      const net = Math.max(0, globalIncome - globalExpense);
      globalCash = Math.round(net * 0.5);
      globalBank = Math.round(net * 0.5);
      totalLiquidBalance = net;
    }

    const globalBalance = totalLiquidBalance;

    const programSummaries = programsInfo.map(p => ({
      _id: p._id,
      name: p.name,
      income: globalIncome,
      expense: globalExpense,
      balance: globalBalance
    }));

    // Normalize recent documents
    const combinedDocs = [
      ...invoices.map(doc => ({
        _id: doc._id,
        docType: 'Invoice',
        docNumber: doc.invoiceNumber || 'INV-DRAFT',
        partyName: doc.customer?.customerName || 'Customer',
        totalAmount: doc.totalAmount || 0,
        createdAt: doc.createdAt || Date.now(),
        status: doc.status || 'PAID',
        path: '/invoices'
      })),
      ...quotations.map(doc => ({
        _id: doc._id,
        docType: 'Quotation',
        docNumber: doc.quotationNumber || 'EST-DRAFT',
        partyName: doc.customer?.customerName || 'Customer',
        totalAmount: doc.totalAmount || 0,
        createdAt: doc.createdAt || Date.now(),
        status: doc.status || 'ISSUED',
        path: '/quotations'
      })),
      ...labourBills.map(doc => ({
        _id: doc._id,
        docType: 'Labour Bill',
        docNumber: doc.billNumber || 'LRB-DRAFT',
        partyName: doc.customer?.customerName || doc.clientName || doc.serviceProviderName || 'Client',
        totalAmount: doc.totalAmount || 0,
        createdAt: doc.createdAt || Date.now(),
        status: doc.status || 'ISSUED',
        path: '/labour-bills'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    const recentTransactions = await Transaction.find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .populate('customer', 'customerName')
      .populate('account', 'accountName');

    res.json({
      combined: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        totalLiquidBalance,
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
