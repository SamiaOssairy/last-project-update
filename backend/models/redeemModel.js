const mongoose = require('mongoose');

const redeemSchema = new mongoose.Schema({
  requester: {
    type: String,
    required: [true, 'Please provide the requester email'],
    ref: 'Member'
  },
  approver: {
    type: String,
    ref: 'Member',
    default: null
  },
  status: {
    type: String,
    required: [true, 'Please provide the status'],
    enum: ['pending', 'parent_approved', 'child_accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  parent_approved_at: {
    type: Date,
    default: null
  },
  child_accepted_at: {
    type: Date,
    default: null
  },
  request_details: {
    type: String,
    required: [true, 'Please provide request details']
  },
  point_deduction: {
    type: Number,
    required: [true, 'Please provide the point deduction amount'],
    min: [0, 'Point deduction cannot be negative']
  },
  wishlist_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WishlistItem',
    default: null
  },
  requested_at: {
    type: Date,
    default: Date.now
  },
  approved_at: {
    type: Date,
    default: null
  },
  fulfilled_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
redeemSchema.index({ requester: 1, status: 1 });
redeemSchema.index({ approver: 1 });
redeemSchema.index({ status: 1, requested_at: -1 });

const Redeem = mongoose.model('Redeem', redeemSchema);

module.exports = Redeem;
