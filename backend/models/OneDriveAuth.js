const mongoose = require('mongoose');
const oneDriveAuthSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  accessToken: { type: String, required: true },
  // refreshToken is NOT required - MSAL Node manages token refresh internally
  // Microsoft may not always return a refresh token in the response object
  refreshToken: { type: String, default: '' },
  expiresOn: { type: Date, required: true },
  accountId: { type: String },
  accountUsername: { type: String },
  lastSyncTime: { type: Date },
  connectedAt: { type: Date, default: Date.now },
  tokenCache: { type: String, default: '' },
  excelFileName: { type: String, default: 'backup.xlsx' }
});

module.exports = mongoose.model('OneDriveAuth', oneDriveAuthSchema);
