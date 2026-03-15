const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  member_mail: {
    type: String,
    required: [true, 'Member email is required'],
    trim: true
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: true
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  recorded_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
locationHistorySchema.index({ member_mail: 1, recorded_at: -1 });
locationHistorySchema.index({ family_id: 1 });
locationHistorySchema.index({ recorded_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);

module.exports = LocationHistory;
