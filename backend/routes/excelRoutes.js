const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const OneDriveAuth = require('../models/OneDriveAuth');
const { pca, triggerPendingSyncs, getValidToken, getGraphClient } = require('../utils/excelSyncService');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Generate Auth URL
router.get('/auth-url', protect, async (req, res) => {
  try {
    const authCodeUrlParameters = {
      scopes: ['Files.ReadWrite.All', 'offline_access'],
      redirectUri: process.env.MS_REDIRECT_URI,
    };
    const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Auth URL Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Handle Auth Callback (usually called by frontend after redirect)
router.post('/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const tokenRequest = {
      code,
      scopes: ['Files.ReadWrite.All', 'offline_access'],
      redirectUri: process.env.MS_REDIRECT_URI,
    };

    const response = await pca.acquireTokenByCode(tokenRequest);

    let authRecord = await OneDriveAuth.findOne({});
    if (!authRecord) {
      authRecord = new OneDriveAuth();
    }
    
    authRecord.accessToken = response.accessToken;
    authRecord.refreshToken = response.refreshToken || '';
    authRecord.expiresOn = response.expiresOn;
    authRecord.connectedAt = new Date();
    await authRecord.save();

    res.json({ message: 'Connected to OneDrive successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Sync Status
router.get('/status', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    const authRecord = await OneDriveAuth.findOne({});
    const isConnected = !!(authRecord && authRecord.refreshToken);

    const transactions = await Transaction.find({ programId: req.programId });
    const totalTransactions = transactions.length;
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    
    const allAccounts = await Account.find({ programId: req.programId });
    const overallBalance = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    // Recent sync history
    const history = await Transaction.find({ programId: req.programId, excelSyncStatus: { $ne: 'Pending' } })
      .sort({ excelSyncTime: -1 })
      .limit(10)
      .select('date description amount type excelSyncStatus excelSyncTime');

    res.json({
      isConnected,
      lastSync: authRecord ? authRecord.lastSyncTime : null,
      totalTransactions,
      totalIncome,
      totalExpense,
      overallBalance,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Trigger Manual Sync
router.post('/sync-now', protect, async (req, res) => {
  try {
    await triggerPendingSyncs();
    
    const authRecord = await OneDriveAuth.findOne({});
    if (authRecord) {
      authRecord.lastSyncTime = new Date();
      await authRecord.save();
    }
    
    res.json({ message: 'Synchronization completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get File Link
router.get('/file-link', protect, async (req, res) => {
    try {
        const token = await getValidToken();
        const client = getGraphClient(token);
        const fileName = 'income-expense-worksheet.xlsx';
        const searchRes = await client.api(`/me/drive/root:/${fileName}`).get();
        res.json({ webUrl: searchRes.webUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
