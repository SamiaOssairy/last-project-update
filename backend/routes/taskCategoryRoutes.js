const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  createTaskCategory,
  getAllTaskCategories,
  updateTaskCategory,
  deleteTaskCategory
} = require('../controllers/TaskCategoryController');

const taskCategoryRouter = express.Router();

taskCategoryRouter.use(protect);

taskCategoryRouter.get('/', getAllTaskCategories);
taskCategoryRouter.post('/', restrictTo('Parent'), createTaskCategory);
taskCategoryRouter.patch('/:categoryId', restrictTo('Parent'), updateTaskCategory);
taskCategoryRouter.delete('/:categoryId', restrictTo('Parent'), deleteTaskCategory);

module.exports = taskCategoryRouter;
