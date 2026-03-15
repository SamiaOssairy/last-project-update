const mongoose = require('mongoose');

const locationAlertSchema = new mongoose.Schema({
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
  alert_type: {
    type: String,
    enum: ['geofence_enter', 'geofence_exit', 'sos', 'low_battery', 'sharing_disabled', 'sharing_enabled', 'custom'],
    required: true
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

locationAlertSchema.index({ member_mail: 1, created_at: -1 });
locationAlertSchema.index({ family_id: 1, is_read: 1 });

const LocationAlert = mongoose.model('LocationAlert', locationAlertSchema);

module.exports = LocationAlert;
