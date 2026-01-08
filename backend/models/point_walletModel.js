const mongoose = require('mongoose');

const pointWalletSchema = new mongoose.Schema({
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email'],
    unique: true
  },
  total_points: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  last_update: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const PointWallet = mongoose.model('PointWallet', pointWalletSchema);

module.exports = PointWallet;
