const mongoose = require('mongoose');

const pointWalletSchema = new mongoose.Schema({
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email'],
    unique: true,
    ref: 'Member'
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

// Index for faster lookups
pointWalletSchema.index({ member_mail: 1 });

// Update last_update timestamp before saving
pointWalletSchema.pre('save', function(next) {
  this.last_update = Date.now();
  next();
});

const PointWallet = mongoose.model('PointWallet', pointWalletSchema);

module.exports = PointWallet;
