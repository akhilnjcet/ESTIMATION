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
    const Invoice = require('../models/Invoice');
    const Quotation = require('../models/Quotation');
    const LabourBill = require('../models/LabourBill');

    // Fetch ALL records for clean, complete aggregation
    const [allTransactions, allInvoices, allLabourBills, allAccounts, programsInfo, invoices, quotations, labourBills] = await Promise.all([
      Transaction.find({}),
      Invoice.find({}),
      LabourBill.find({}),
      Account.find({}),
      Program.find({}, 'name'),
      Invoice.find({}).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      Quotation.find({}).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      LabourBill.find({}).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName')
    ]);

    let globalIncome = 0;
    let globalExpense = 0;
    let globalCash = 0;
    let globalBank = 0;
    let globalUpi = 0;

    // 1. Transactions (Income / Expense)
    allTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'Income') globalIncome += amt;
      if (t.type === 'Expense') globalExpense += amt;
    });

    // 2. Accounts (Cash / Bank / UPI Balances)
    allAccounts.forEach(acc => {
      const bal = parseFloat(acc.balance) || 0;
      const accType = (acc.type || '').toLowerCase();
      if (accType === 'cash') globalCash += bal;
      else if (accType === 'bank') globalBank += bal;
      else if (accType === 'upi') globalUpi += bal;
      else globalBank += bal;
    });

    const totalLiquidBalance = globalCash + globalBank + globalUpi;
    const globalBalance = globalIncome - globalExpense;

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
