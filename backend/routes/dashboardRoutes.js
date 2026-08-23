const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Program = require('../models/Program');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/combined
// @desc    Get dashboard metrics strictly isolated for the active program
router.get('/combined', protect, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const Quotation = require('../models/Quotation');
    const LabourBill = require('../models/LabourBill');

    let activeProgramId = null;

    if (req.programId && mongoose.Types.ObjectId.isValid(req.programId)) {
      activeProgramId = req.programId;
    } else {
      // Find the user's default/first accessible program
      const userProg = await Program.findOne({
        $or: [
          { owner: req.user._id },
          { _id: { $in: req.user.programAccess || [] } }
        ]
      });
      if (userProg) activeProgramId = userProg._id;
    }

    // Strict program filter — if no active program exists, query with non-matching ID
    const filter = activeProgramId
      ? { programId: activeProgramId }
      : { programId: new mongoose.Types.ObjectId() };

    const [
      allTransactions,
      allInvoices,
      allLabourBills,
      allAccounts,
      programsInfo,
      invoices,
      quotations,
      labourBills
    ] = await Promise.all([
      Transaction.find(filter),
      Invoice.find(filter),
      LabourBill.find(filter),
      Account.find(filter),
      Program.find({
        $or: [
          { owner: req.user._id },
          { _id: { $in: req.user.programAccess || [] } }
        ]
      }, 'name'),
      Invoice.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName phone address email gstNumber'),
      Quotation.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName phone address email gstNumber'),
      LabourBill.find(filter).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName phone address email gstNumber')
    ]);

    let globalIncome = 0;
    let globalExpense = 0;
    let globalCash = 0;
    let globalBank = 0;
    let globalUpi = 0;
    let globalCashOpening = 0;
    let globalBankOpening = 0;
    let globalUpiOpening = 0;

    // 1. Calculate Income & Expense from program's transactions
    allTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'Income') globalIncome += amt;
      if (t.type === 'Expense') globalExpense += amt;
    });

    // 2. Fallback to Tax Invoices for Income if no explicit Income transactions recorded
    if (globalIncome === 0 && allInvoices.length > 0) {
      allInvoices.forEach(inv => {
        globalIncome += (Number(inv.totalAmount) || 0);
      });
    }

    // 3. Fallback to Labour & Transport Bills for Expenses if no explicit Expense transactions recorded
    if (globalExpense === 0 && allLabourBills.length > 0) {
      allLabourBills.forEach(bill => {
        globalExpense += (Number(bill.totalAmount) || 0);
      });
    }

    // 4. Calculate actual Account balances for this program
    allAccounts.forEach(acc => {
      const bal = Number(acc.balance) || 0;
      const opBal = Number(acc.openingBalance) || 0;
      const accType = (acc.type || '').toLowerCase();
      if (accType === 'cash') {
        globalCash += bal;
        globalCashOpening += opBal;
      } else if (accType === 'bank') {
        globalBank += bal;
        globalBankOpening += opBal;
      } else if (accType === 'upi') {
        globalUpi += bal;
        globalUpiOpening += opBal;
      } else {
        globalBank += bal;
        globalBankOpening += opBal;
      }
    });

    const totalLiquidBalance = globalCash + globalBank + globalUpi;
    const globalBalance = totalLiquidBalance;

    const programSummaries = programsInfo.map(p => ({
      _id: p._id,
      name: p.name,
      income: globalIncome,
      expense: globalExpense,
      balance: globalBalance
    }));

    // Normalize recent documents for this program
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

    let recentTransactions = [];
    try {
      recentTransactions = await Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .limit(6)
        .populate('party', 'customerName')
        .populate('account', 'name type');
    } catch (txErr) {
      console.warn('Recent transactions populate fallback:', txErr.message);
      recentTransactions = await Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .limit(6);
    }

    res.json({
      combined: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        totalLiquidBalance,
        cashBalance: globalCash,
        bankBalance: globalBank,
        upiBalance: globalUpi,
        cashOpeningBalance: globalCashOpening,
        bankOpeningBalance: globalBankOpening,
        upiOpeningBalance: globalUpiOpening
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

function globalAccountsExist(accounts) {
  return Array.isArray(accounts) && accounts.length > 0;
}

module.exports = router;
