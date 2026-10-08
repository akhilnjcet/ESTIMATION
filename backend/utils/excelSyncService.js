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

const getValidToken = async (programId) => {
  if (!programId) throw new Error('Program ID is required for multi-tenant auth');
  let authRecord = await OneDriveAuth.findOne({ programId });
  if (!authRecord) throw new Error('No OneDrive authentication found. Please connect in settings.');

  // If token is still valid, use it
  if (new Date() < new Date(authRecord.expiresOn)) {
    return authRecord.accessToken;
  }

  // Try to refresh using MSAL silent flow with stored account
  if (pca && authRecord.accountId) {
    try {
      // Deserialize the cache from database so Vercel serverless function knows about it
      if (authRecord.tokenCache) {
        pca.getTokenCache().deserialize(authRecord.tokenCache);
      }
      
      const accounts = await pca.getTokenCache().getAllAccounts();
      const account = accounts.find(a => a.homeAccountId === authRecord.accountId) || accounts[0];
      
      if (account) {
        const silentRequest = {
          account,
          scopes: ['Files.ReadWrite.All', 'offline_access'],
        };
        const response = await pca.acquireTokenSilent(silentRequest);
        
        // Re-serialize cache if it changed
        authRecord.tokenCache = pca.getTokenCache().serialize();
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


const findExcelFile = async (client, fileName) => {
  // Strategy 1: Try exact paths directly (instant, no search index needed)
  const pathsToTry = [
    `/me/drive/root:/Documents/${fileName}`, // User's actual location
    `/me/drive/root:/${fileName}`            // Fallback to root
  ];

  for (const path of pathsToTry) {
    try {
      const res = await client.api(path).get();
      console.log(`File found at exact path: ${path}`);
      return res;
    } catch (err) {
      // Ignore and try next path
    }
  }

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
        console.log(`Found Excel file via search: ${found.name}`);
        return found;
      }
    }
  } catch (searchErr) {
    console.error('Drive search failed:', searchErr.message);
  }
  
  throw new Error(`Could not find an Excel file named '${fileName}' in your OneDrive (checked Documents folder and Root).`);
};

const syncTransactionToExcel = async (transactionId) => {
  try {
    const tx = await Transaction.findById(transactionId).populate('account').populate('toAccount');
    if (!tx) throw new Error('Transaction not found');
    
    // Format data for Excel
    const allAccounts = await Account.find({ programId: tx.programId });
    const overallBalance = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const token = await getValidToken();
    const client = getGraphClient(token);

    const fileName = 'backup.xlsx';
    const searchRes = await findExcelFile(client, fileName);
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

const triggerPendingSyncs = async (programId = null, isReset = false) => {
    const query = { excelSyncStatus: { $in: ['Pending', 'Failed'] } };
    if (programId) query.programId = programId;

    const pendingTxs = await Transaction.find(query).populate('account').populate('toAccount').sort({ date: 1 });
    if (pendingTxs.length === 0) return;

    try {
        const token = await getValidToken();
        const client = getGraphClient(token);
        const fileName = 'backup.xlsx';
        const searchRes = await findExcelFile(client, fileName);
        const fileId = searchRes.id;
        
        const worksheets = await client.api(`/me/drive/items/${fileId}/workbook/worksheets`).get();
        const sheetId = worksheets.value[0].id;
        
        const tables = await client.api(`/me/drive/items/${fileId}/workbook/worksheets/${sheetId}/tables`).get();
        if (!tables.value || tables.value.length === 0) throw new Error('No table found');
        const tableId = tables.value[0].id;

        const columnsRes = await client.api(`/me/drive/items/${fileId}/workbook/tables/${tableId}/columns`).get();
        const colNames = columnsRes.value.map(c => c.name.trim().toLowerCase());
        
        let rowsToAdd = [];
        const formatDate = (date) => new Date(date).toLocaleDateString('en-US');
        
        // Optimize: load all accounts once to calculate overall balances per program
        const allAccounts = await Account.find(programId ? { programId } : {});
        const overallBalances = {};
        allAccounts.forEach(acc => {
           if (!overallBalances[acc.programId]) overallBalances[acc.programId] = 0;
           overallBalances[acc.programId] += (acc.balance || 0);
        });

        const buildRow = (tx, isIncome, isExpense, isTransferFrom, isTransferTo) => {
            const overallBalance = overallBalances[tx.programId] || 0;
            const account = isTransferTo ? tx.toAccount : tx.account;
            const accountName = account ? account.name : 'Unknown Account';
            const accountBalance = account ? account.balance : 0;
            
            const row = new Array(colNames.length).fill("");
            
            colNames.forEach((colName, index) => {
                if (colName.includes('account type')) row[index] = account ? account.type : '';
                else if (colName.includes('account') && !colName.includes('balance')) row[index] = accountName;
                else if (colName.includes('date')) row[index] = formatDate(tx.date);
                else if (colName.includes('description')) {
                    if (isTransferFrom) row[index] = `Transfer to ${tx.toAccount?.name || 'Unknown'}: ${tx.description || ''}`;
                    else if (isTransferTo) row[index] = `Transfer from ${tx.account?.name || 'Unknown'}: ${tx.description || ''}`;
                    else row[index] = tx.description || '';
                }
                else if (colName.includes('category')) row[index] = (isTransferFrom || isTransferTo) ? 'Transfer' : (tx.category || '');
                else if (colName.includes('income') || colName.includes('in')) {
                    if (isIncome || isTransferTo) row[index] = tx.amount || 0;
                }
                else if (colName.includes('expense') || colName.includes('out')) {
                    if (isExpense || isTransferFrom) row[index] = tx.amount || 0;
                }
                else if (colName.includes('overall balance')) {
                    row[index] = '=IF(ISBLANK(INDEX(B:B,ROW()))," - ",IFERROR(OFFSET(INDEX(I:I,ROW()),-1,0,1,1)+INDEX(F:F,ROW())-INDEX(G:G,ROW()),INDEX(F:F,ROW())-INDEX(G:G,ROW())))';
                }
                else if (colName.includes('balance')) {
                    row[index] = '=SUMIF($A$3:INDEX(A:A,ROW()),INDEX(A:A,ROW()),$F$3:INDEX(F:F,ROW()))-SUMIF($A$3:INDEX(A:A,ROW()),INDEX(A:A,ROW()),$G$3:INDEX(G:G,ROW()))';
                }
            });
            return row;
        };

        // If this is a full reset, inject Opening Balances first!
        if (isReset) {
            allAccounts.forEach(acc => {
                if (acc.openingBalance && acc.openingBalance > 0) {
                    const row = new Array(colNames.length).fill("");
                    colNames.forEach((colName, index) => {
                        if (colName.includes('account type')) row[index] = acc.type || '';
                        else if (colName.includes('account') && !colName.includes('balance')) row[index] = acc.name;
                        else if (colName.includes('date')) row[index] = formatDate(acc.date || new Date());
                        else if (colName.includes('description')) row[index] = 'Opening Balance';
                        else if (colName.includes('category')) row[index] = '[Balance]';
                        else if (colName.includes('income') || colName.includes('in')) row[index] = acc.openingBalance;
                        else if (colName.includes('expense') || colName.includes('out')) row[index] = "";
                        else if (colName.includes('overall balance')) {
                            row[index] = '=IF(ISBLANK(INDEX(B:B,ROW()))," - ",IFERROR(OFFSET(INDEX(I:I,ROW()),-1,0,1,1)+INDEX(F:F,ROW())-INDEX(G:G,ROW()),INDEX(F:F,ROW())-INDEX(G:G,ROW())))';
                        }
                        else if (colName.includes('balance')) {
                            row[index] = '=SUMIF($A$3:INDEX(A:A,ROW()),INDEX(A:A,ROW()),$F$3:INDEX(F:F,ROW()))-SUMIF($A$3:INDEX(A:A,ROW()),INDEX(A:A,ROW()),$G$3:INDEX(G:G,ROW()))';
                        }
                    });
                    rowsToAdd.push(row);
                }
            });
        }

        for (const tx of pendingTxs) {
            if (tx.type === 'Income') {
                rowsToAdd.push(buildRow(tx, true, false, false, false));
            } else if (tx.type === 'Expense') {
                rowsToAdd.push(buildRow(tx, false, true, false, false));
            } else if (tx.type === 'Transfer') {
                rowsToAdd.push(buildRow(tx, false, false, true, false)); // From
                rowsToAdd.push(buildRow(tx, false, false, false, true)); // To
            }
        }

        // Batch upload
        // Graph API can handle large payloads, but we should chunk if > 500 rows. For 57 it's perfectly fine.
        const chunkSize = 500;
        for (let i = 0; i < rowsToAdd.length; i += chunkSize) {
            const chunk = rowsToAdd.slice(i, i + chunkSize);
            await client.api(`/me/drive/items/${fileId}/workbook/tables/${tableId}/rows/add`).post({ values: chunk });
        }

        // Mark all as synced
        const txIds = pendingTxs.map(t => t._id);
        await Transaction.updateMany(
            { _id: { $in: txIds } },
            { $set: { excelSyncStatus: 'Synced', excelSyncTime: new Date(), excelRowId: 'synced-batch' } }
        );

    } catch (e) {
        console.error('Batch sync failed:', e);
        const txIds = pendingTxs.map(t => t._id);
        await Transaction.updateMany({ _id: { $in: txIds } }, { $set: { excelSyncStatus: 'Failed' } });
        // Throw the error so the frontend can display exactly what went wrong
        throw new Error(e.response?.data?.error?.message || e.message || 'Batch sync failed');
    }
};

module.exports = {
  pca,
  getGraphClient,
  getValidToken,
  syncTransactionToExcel,
  triggerPendingSyncs
};
