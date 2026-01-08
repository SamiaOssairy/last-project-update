const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const WishlistCategory = require("../models/wishlist_categoryModel");

//========================================================================================
// Create a wishlist category
exports.createWishlistCategory = catchAsync(async (req, res, next) => {
  const { title, description } = req.body;
  
  if (!title) {
    return next(new AppError("Please provide a title", 400));
  }
  
  const newCategory = await WishlistCategory.create({
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
// Get all wishlist categories for the family
exports.getAllWishlistCategories = catchAsync(async (req, res, next) => {
  const categories = await WishlistCategory.find({ family_id: req.familyAccount._id });
  
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories }
  });
});

//========================================================================================
// Update a wishlist category
exports.updateWishlistCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { title, description } = req.body;
  
  const category = await WishlistCategory.findOne({ 
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
// Delete a wishlist category
exports.deleteWishlistCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  
  const category = await WishlistCategory.findOne({ 
    _id: categoryId, 
    family_id: req.familyAccount._id 
  });
  
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  
  await WishlistCategory.findByIdAndDelete(categoryId);
  
  res.status(204).json({
    status: "success",
    data: null
  });
});
