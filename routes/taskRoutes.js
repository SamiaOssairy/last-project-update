const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  assignTask,
  approveTaskAssignment,
  getPendingAssignments,
  getMyTasks,
  getAllAssignedTasks,
  completeTask,
  getTasksWaitingApproval,
  approveTaskCompletion,
  manualPenalty
} = require('../controllers/TaskController');

const taskRouter = express.Router();

// All routes require authentication
taskRouter.use(protect);

// Task templates
taskRouter.get('/', getAllTasks);
taskRouter.post('/', createTask);
taskRouter.patch('/:taskId', restrictTo('Parent'), updateTask);
taskRouter.delete('/:taskId', restrictTo('Parent'), deleteTask);

// Task assignments
taskRouter.post('/assign', assignTask);
taskRouter.get('/pending-assignments', restrictTo('Parent'), getPendingAssignments);
taskRouter.patch('/assignments/:taskDetailId/approve-assignment', restrictTo('Parent'), approveTaskAssignment);

// My tasks
taskRouter.get('/my-tasks', getMyTasks);
taskRouter.get('/all-assigned', getAllAssignedTasks);

// Task completion
taskRouter.patch('/assignments/:taskDetailId/complete', completeTask);
taskRouter.get('/waiting-approval', restrictTo('Parent'), getTasksWaitingApproval);
taskRouter.patch('/assignments/:taskDetailId/approve-completion', restrictTo('Parent'), approveTaskCompletion);

// Manual penalty
taskRouter.post('/assignments/:taskDetailId/penalty', restrictTo('Parent'), manualPenalty);

module.exports = taskRouter;
