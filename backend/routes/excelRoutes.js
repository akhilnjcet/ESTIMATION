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
    // Check if Microsoft credentials are configured
    if (!process.env.MS_CLIENT_ID || process.env.MS_CLIENT_ID === 'dummy_client_id') {
      return res.status(500).json({ message: 'Microsoft Client ID not configured. Please add MS_CLIENT_ID to environment variables.' });
    }
    if (!process.env.MS_CLIENT_SECRET || process.env.MS_CLIENT_SECRET === 'dummy_client_secret') {
      return res.status(500).json({ message: 'Microsoft Client Secret not configured. Please add MS_CLIENT_SECRET to environment variables.' });
    }
    if (!process.env.MS_REDIRECT_URI) {
      return res.status(500).json({ message: 'Microsoft Redirect URI not configured. Please add MS_REDIRECT_URI to environment variables.' });
    }
    if (!pca) {
      return res.status(500).json({ message: 'Microsoft MSAL client not initialized. Check your MS_CLIENT_ID and MS_CLIENT_SECRET environment variables.' });
    }

    const authCodeUrlParameters = {
      scopes: ['Files.ReadWrite.All', 'offline_access'],
      redirectUri: process.env.MS_REDIRECT_URI,
    };
    const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Auth URL Generation Error:", error);
    res.status(500).json({ message: `Failed to generate OneDrive login URL: ${error.message}` });
  }
});


// Handle Auth Callback - PUBLIC route, called by Microsoft after login
// Microsoft redirects here with ?code=... as a GET request
router.get('/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      console.error('Microsoft OAuth Error:', error, error_description);
      const frontendUrl = process.env.FRONTEND_URL || 'https://krishnabilling-akhilnjcets-projects.vercel.app';
      return res.redirect(`${frontendUrl}/excel-sync?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://krishnabilling-akhilnjcets-projects.vercel.app'}/excel-sync?error=No+authorization+code+received`);
    }

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

    console.log('OneDrive connected successfully for account:', response.account?.username);

    // Redirect back to the frontend Excel Sync page with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://krishnabilling-akhilnjcets-projects.vercel.app';
    res.redirect(`${frontendUrl}/excel-sync?connected=true`);

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://krishnabilling-akhilnjcets-projects.vercel.app';
    res.redirect(`${frontendUrl}/excel-sync?error=${encodeURIComponent(error.message)}`);
  }
});


// Get Sync Status
router.get('/status', protect, async (req, res) => {
  try {
    const authRecord = await OneDriveAuth.findOne({});
    // Connected if we have a valid access token (refresh token may not always be stored)
    const isConnected = !!(authRecord && authRecord.accessToken);

    // Use programId from middleware, fall back gracefully
    const programId = req.programId;
    
    let totalTransactions = 0, totalIncome = 0, totalExpense = 0, overallBalance = 0, history = [];
    
    if (programId) {
      const transactions = await Transaction.find({ programId });
      totalTransactions = transactions.length;
      totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      
      const allAccounts = await Account.find({ programId });
      overallBalance = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      
      history = await Transaction.find({ programId, excelSyncStatus: { $ne: 'Pending' } })
        .sort({ excelSyncTime: -1 })
        .limit(10)
        .select('date description amount type excelSyncStatus excelSyncTime');
    }

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
    const fileName = 'backup.xlsx';

    let webUrl = null;

    // Strategy 1: Try exact paths directly
    const pathsToTry = [
      `/me/drive/root:/Documents/${fileName}`, // User's actual location
      `/me/drive/root:/${fileName}`            // Fallback to root
    ];

    for (const path of pathsToTry) {
      try {
        const res = await client.api(path).get();
        webUrl = res.webUrl;
        console.log(`File found at exact path: ${path}`);
        break; // Stop if found
      } catch (err) {
        // Ignore and try next path
      }
    }

    if (!webUrl) {
      console.log(`File not found at exact paths, trying search...`);
      // Strategy 2: Search across entire OneDrive, but ONLY return Excel files
      try {
        const baseName = fileName.replace('.xlsx', '');
        const searchRes = await client.api(`/me/drive/root/search(q='${baseName}')`).get();
        
        if (searchRes.value && searchRes.value.length > 0) {
          const excelFiles = searchRes.value.filter(f => 
            f.file && (f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'))
          );

          if (excelFiles.length > 0) {
            const exactMatch = excelFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
            const found = exactMatch || excelFiles[0];
            webUrl = found.webUrl;
            console.log(`Found Excel file via search: ${found.name}`);
          }
        }
      } catch (searchErr) {
        console.error('Drive search failed:', searchErr.message);
      }
    }

    if (!webUrl) {
      return res.status(404).json({ 
        message: `Could not find an Excel file named '${fileName}' in your OneDrive (checked Documents folder and Root).`
      });
    }

    res.json({ webUrl });
  } catch (error) {
    console.error('File link error:', error.message);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
