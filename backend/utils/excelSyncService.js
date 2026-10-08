const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const OneDriveAuth = require('../models/OneDriveAuth');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const mongoose = require('mongoose');

const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.MS_CLIENT_SECRET || 'dummy_client_secret',
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID || 'common'}`,
  }
};

// Safe Server-Side Logging
console.log("=== Microsoft OAuth Configuration ===");
console.log("Authority:", msalConfig.auth.authority);
console.log("Client ID:", msalConfig.auth.clientId === 'dummy_client_id' ? 'Missing (Using Dummy)' : 'Loaded from ENV');
console.log("Redirect URI:", process.env.MS_REDIRECT_URI || 'Missing in ENV');
console.log("Requested Scopes: ['Files.ReadWrite.All', 'offline_access']");
console.log("=====================================");

let pca;
try {
    pca = new ConfidentialClientApplication(msalConfig);
} catch (e) {
    console.error("Failed to initialize MSAL (OneDrive):", e.message);
}

const getGraphClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

const refreshAccessToken = async (authRecord) => {
  try {
    const response = await pca.acquireTokenByRefreshToken({
      refreshToken: authRecord.refreshToken,
      scopes: ['Files.ReadWrite.All', 'offline_access']
    });
    authRecord.accessToken = response.accessToken;
    authRecord.refreshToken = response.refreshToken || authRecord.refreshToken;
    authRecord.expiresOn = response.expiresOn;
    await authRecord.save();
    return response.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

const getValidToken = async () => {
  let authRecord = await OneDriveAuth.findOne({});
  if (!authRecord) throw new Error('No OneDrive authentication found. Please connect in settings.');

  // If token is still valid, use it
  if (new Date() < new Date(authRecord.expiresOn)) {
    return authRecord.accessToken;
  }

  // Try to refresh using MSAL silent flow with stored account
  if (pca && authRecord.accountId) {
    try {
      const accounts = await pca.getTokenCache().getAllAccounts();
      const account = accounts.find(a => a.homeAccountId === authRecord.accountId) || accounts[0];
      
      if (account) {
        const silentRequest = {
          account,
          scopes: ['Files.ReadWrite.All', 'offline_access'],
        };
        const response = await pca.acquireTokenSilent(silentRequest);
        authRecord.accessToken = response.accessToken;
        authRecord.expiresOn = response.expiresOn;
        await authRecord.save();
        return response.accessToken;
      }
    } catch (silentError) {
      console.warn('Silent token refresh failed:', silentError.message);
    }
  }

  // If silent refresh failed and we have a refresh token, try that
  if (authRecord.refreshToken) {
    return await refreshAccessToken(authRecord);
  }

  throw new Error('Token expired and could not be refreshed. Please reconnect OneDrive.');
};


const syncTransactionToExcel = async (transactionId) => {
  try {
    const tx = await Transaction.findById(transactionId).populate('account').populate('toAccount');
    if (!tx) throw new Error('Transaction not found');
    
    // Format data for Excel
    // Account, Date, Description, Category, Income Money IN, Expense Money OUT, Account Balance, Overall Balance
    // Balances are taken directly from DB assuming they are up-to-date, or we calculate them.
    // The prompt says: "Calculate separately for each account", but our MongoDB Account models already track balance.
    // So we can use the account.balance for Account Balance.
    // For Overall Balance, we can sum all account balances.
    
    const allAccounts = await Account.find({ programId: tx.programId });
    const overallBalance = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const token = await getValidToken();
    const client = getGraphClient(token);

    const fileName = process.env.EXCEL_FILE_NAME || 'backup.xlsx';
    
    // We assume the file is at the root and has a Table1 on Sheet1
    // A robust way is to just use a range append if table doesn't exist, but Table add row is standard.
    // Let's first try to find the drive item id
    const searchRes = await client.api(`/me/drive/root:/${fileName}`).get();
    const fileId = searchRes.id;
    
    // Get worksheets to find the first one
    const worksheets = await client.api(`/me/drive/items/${fileId}/workbook/worksheets`).get();
    const sheetId = worksheets.value[0].id;
    
    // Get tables in the worksheet
    const tables = await client.api(`/me/drive/items/${fileId}/workbook/worksheets/${sheetId}/tables`).get();
    if (!tables.value || tables.value.length === 0) {
       throw new Error('No table found in the Excel worksheet. Please ensure the template is formatted as a Table.');
    }
    const tableId = tables.value[0].id;

    // We might have a Transfer which has 2 legs, but let's handle Income/Expense first.
    // If it's a Transfer, we add two rows (one expense from fromAccount, one income to toAccount).
    let rowsToAdd = [];
    
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US');

    if (tx.type === 'Income') {
       rowsToAdd.push([
           tx.account.name,
           formatDate(tx.date),
           tx.description || '',
           tx.category || '',
           tx.amount,
           "",
           tx.account.balance,
           overallBalance
       ]);
    } else if (tx.type === 'Expense') {
       rowsToAdd.push([
           tx.account.name,
           formatDate(tx.date),
           tx.description || '',
           tx.category || '',
           "",
           tx.amount,
           tx.account.balance,
           overallBalance
       ]);
    } else if (tx.type === 'Transfer') {
       // Row 1: Money Out from 'account'
       rowsToAdd.push([
           tx.account.name,
           formatDate(tx.date),
           `Transfer to ${tx.toAccount.name}: ${tx.description || ''}`,
           'Transfer',
           "",
           tx.amount,
           tx.account.balance, // Actually we need the snapshot, but we are using current balance
           overallBalance
       ]);
       // Row 2: Money In to 'toAccount'
       rowsToAdd.push([
           tx.toAccount.name,
           formatDate(tx.date),
           `Transfer from ${tx.account.name}: ${tx.description || ''}`,
           'Transfer',
           tx.amount,
           "",
           tx.toAccount.balance,
           overallBalance
       ]);
    }
    
    // Append to table
    const result = await client.api(`/me/drive/items/${fileId}/workbook/tables/${tableId}/rows/add`).post({
        values: rowsToAdd
    });

    tx.excelSyncStatus = 'Synced';
    tx.excelSyncTime = new Date();
    tx.excelRowId = 'synced'; // result doesn't always return row id, but we mark it synced
    await tx.save();

  } catch (error) {
    console.error('Excel Sync Error:', error);
    const tx = await Transaction.findById(transactionId);
    if (tx) {
        tx.excelSyncStatus = 'Failed';
        await tx.save();
    }
    throw error;
  }
};

const triggerPendingSyncs = async () => {
    // Find all pending/failed transactions and try to sync them
    const pendingTxs = await Transaction.find({ excelSyncStatus: { $in: ['Pending', 'Failed'] } });
    for (const tx of pendingTxs) {
        try {
            await syncTransactionToExcel(tx._id);
        } catch (e) {
            console.error(`Failed to sync pending transaction ${tx._id}:`, e);
        }
    }
};

module.exports = {
  pca,
  getGraphClient,
  getValidToken,
  syncTransactionToExcel,
  triggerPendingSyncs
};
