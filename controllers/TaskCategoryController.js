const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const TaskCategory = require("../models/task_categoryModel");

//========================================================================================
// Create a task category
exports.createTaskCategory = catchAsync(async (req, res, next) => {
  const { title, description } = req.body;
  
  if (!title) {
    return next(new AppError("Please provide a title", 400));
  }
  
  const newCategory = await TaskCategory.create({
    title,
    description: description || '',
    family_id: req.familyAccount._id
  });
  
  res.status(201).json({
    status: "success",
    data: { category: newCategory }
  });
});

//========================================================================================
// Get all task categories for the family
exports.getAllTaskCategories = catchAsync(async (req, res, next) => {
  const categories = await TaskCategory.find({ family_id: req.familyAccount._id });
  
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories }
  });
});

//========================================================================================
// Update a task category
exports.updateTaskCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { title, description } = req.body;
  
  const category = await TaskCategory.findOne({ 
    _id: categoryId, 
    family_id: req.familyAccount._id 
  });
  
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  
  if (title) category.title = title;
  if (description !== undefined) category.description = description;
  
  await category.save();
  
  res.status(200).json({
    status: "success",
    data: { category }
  });
});

//========================================================================================
// Delete a task category
exports.deleteTaskCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  
  const category = await TaskCategory.findOne({ 
    _id: categoryId, 
    family_id: req.familyAccount._id 
  });
  
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  
  await TaskCategory.findByIdAndDelete(categoryId);
  
  res.status(204).json({
    status: "success",
    data: null
  });
});
