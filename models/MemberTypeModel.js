const mongoose = require('mongoose');

const memberTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide the member type'],
    unique: true,
    default: 'Parent',
  },
  // permissions is not required for creating a member type
  Permissions: {
    type: [String],
   }
});

const MemberType = mongoose.model('MemberType', memberTypeSchema);

module.exports = MemberType;