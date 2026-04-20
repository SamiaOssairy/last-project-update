const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unit_name: {
    type: String,
    required: [true, 'Please provide the unit name'],
    unique: true,
    trim: true
  },
  unit_type: {
    type: String,
    required: [true, 'Please provide the unit type'],
    enum: ['weight', 'volume', 'count']
  }
});

// Index for faster lookups
unitSchema.index({ unit_type: 1 });

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
//...........................