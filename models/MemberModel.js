
const mongoose = require('mongoose');
const validator = require('validator');
const memberSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide your username'],
    unique: true,
  },
  mail:{
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: [true, 'Please provide a family account ID']
  },
  member_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MemberType',
    required: [true, 'Please provide a member type ID']
  },
  birth_date: {
    type: Date,
    required: [true, 'Please provide your birth date']
  }
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;














