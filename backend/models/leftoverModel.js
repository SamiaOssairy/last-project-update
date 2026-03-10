const mongoose = require('mongoose');

const leftoverSchema = new mongoose.Schema({
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email'],
    ref: 'Member'
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: [true, 'Please provide a family account ID']
  },
  item_name: {
    type: String,
    required: [true, 'Please provide the leftover item name'],
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCategory',
    default: null
  },
  unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Please provide the unit']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide the quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  meal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    default: null
  },
  date_added: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date,
    required: [true, 'Please provide the expiry date']
  }
}, {
  timestamps: true
});

// Indexes
leftoverSchema.index({ family_id: 1 });
leftoverSchema.index({ expiry_date: 1 });
leftoverSchema.index({ member_mail: 1 });

const Leftover = mongoose.model('Leftover', leftoverSchema);

module.exports = Leftover;
