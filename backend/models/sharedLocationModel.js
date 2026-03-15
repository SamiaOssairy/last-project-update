const mongoose = require('mongoose');

const sharedLocationSchema = new mongoose.Schema({
  sender_mail: {
    type: String,
    required: [true, 'Sender email is required'],
    trim: true
  },
  receiver_mail: {
    type: String,
    required: [true, 'Receiver email is required'],
    trim: true
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: true
  },
  location_name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  shared_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    default: null
  },
  is_viewed: {
    type: Boolean,
    default: false
  }
});

sharedLocationSchema.index({ receiver_mail: 1, shared_at: -1 });
sharedLocationSchema.index({ sender_mail: 1, shared_at: -1 });
sharedLocationSchema.index({ family_id: 1 });
sharedLocationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expires_at: { $ne: null } } });

const SharedLocation = mongoose.model('SharedLocation', sharedLocationSchema);

module.exports = SharedLocation;
