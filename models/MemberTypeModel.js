const mongoose = require('mongoose');

const memberTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide the member type'],
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: [true, 'Please provide a family account ID']
  },
  // permissions is not required for creating a member type
  Permissions: {
    type: [String],
   }
});

// Create compound index: member type must be unique per family
memberTypeSchema.index({ type: 1, family_id: 1 }, { unique: true });

const MemberType = mongoose.model('MemberType', memberTypeSchema);

module.exports = MemberType;