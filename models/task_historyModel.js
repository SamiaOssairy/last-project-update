const mongoose = require('mongoose');

const taskDetailsSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Please provide the task ID']
  },
  member_mail: {
    type: String,
    required: [true, 'Please provide the member email'],
    ref: 'Member'
  },
  assigned_points: {
    type: Number,
    required: [true, 'Please provide the assigned points'],
    min: [0, 'Assigned points cannot be negative']
  },
  penalty_points: {
    type: Number,
    default: 0,
    min: [0, 'Penalty points cannot be negative']
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide a deadline']
  },
  assigned_by: {
    type: String,
    required: [true, 'Please provide who assigned the task'],
    ref: 'Member'
  },
  assignment_approved: {
    type: Boolean,
    default: false
  },
  assignment_approved_by: {
    type: String,
    ref: 'Member',
    default: null
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    required: [true, 'Please provide the task status'],
    enum: ['assigned', 'in_progress', 'completed', 'late', 'approved', 'rejected'],
    default: 'assigned'
  },
  completed_at: {
    type: Date,
    default: null
  },
  approved_by: {
    type: String,
    ref: 'Member',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
taskDetailsSchema.index({ task_id: 1, member_mail: 1 });
taskDetailsSchema.index({ member_mail: 1, status: 1 });
taskDetailsSchema.index({ deadline: 1, status: 1 });

const TaskDetails = mongoose.model('TaskDetails', taskDetailsSchema);

module.exports = TaskDetails;
