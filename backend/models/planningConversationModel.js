const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const planningConversationSchema = new mongoose.Schema({
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyAccount',
    required: true
  },
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

planningConversationSchema.index({ family_id: 1, member_id: 1 });

const PlanningConversation = mongoose.models.PlanningConversation ||
  mongoose.model('PlanningConversation', planningConversationSchema);

module.exports = PlanningConversation;
