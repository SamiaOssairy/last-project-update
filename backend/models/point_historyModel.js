const mongoose = require('mongoose');

const pointDetailsSchema = new mongoose.Schema({
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PointWallet',
    required: [true, 'Please provide the wallet ID']
  },
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email']
  },
  points_amount: {
    type: Number,
    required: [true, 'Please provide the points amount']
  },
  reason_type: {
    type: String,
    required: [true, 'Please provide the reason type'],
    enum: ['task_completion', 'penalty', 'redeem', 'bonus', 'adjustment', 'manual_grant']
  },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  redeem_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Redeem',
    default: null
  },
  granted_by: {
    type: String,
    required: [true, 'Please provide who granted the points']
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
pointDetailsSchema.index({ wallet_id: 1, createdAt: -1 });
pointDetailsSchema.index({ member_mail: 1, createdAt: -1 });
pointDetailsSchema.index({ granted_by: 1 });

const PointDetails = mongoose.model('PointDetails', pointDetailsSchema);

module.exports = PointDetails;
