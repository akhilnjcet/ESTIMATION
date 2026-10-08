const mongoose = require('mongoose');

const oneDriveAuthSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresOn: { type: Date, required: true },
  accountId: { type: String }, // optional, for tracking user
  lastSyncTime: { type: Date },
  connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OneDriveAuth', oneDriveAuthSchema);
