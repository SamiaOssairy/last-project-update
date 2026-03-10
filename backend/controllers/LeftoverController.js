const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const Leftover = require("../models/leftoverModel");
const LeftoverCategory = require("../models/leftoverCategoryModel");
const InventoryCategory = require("../models/inventoryCategoryModel");

//========================================================================================
// LEFTOVER CATEGORY MANAGEMENT
//========================================================================================

// Create leftover category
exports.createLeftoverCategory = catchAsync(async (req, res, next) => {
  const { title, description } = req.body;

  if (!title) {
    return next(new AppError("Please provide the category title", 400));
  }

  const category = await LeftoverCategory.create({
    title,
    description: description || '',
    family_id: req.familyAccount._id
  });

  res.status(201).json({
    status: "success",
    data: { category }
  });
});

//========================================================================================
// Get all leftover categories for the family
exports.getAllLeftoverCategories = catchAsync(async (req, res, next) => {
  const categories = await LeftoverCategory.find({ family_id: req.familyAccount._id })
    .sort({ title: 1 });

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories }
  });
});

//========================================================================================
// Delete leftover category
exports.deleteLeftoverCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await LeftoverCategory.findOne({
    _id: categoryId,
    family_id: req.familyAccount._id
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  const leftoverCount = await Leftover.countDocuments({ category_id: categoryId });
  if (leftoverCount > 0) {
    return next(new AppError(`Cannot delete category with ${leftoverCount} leftovers using it`, 400));
  }

  await LeftoverCategory.findByIdAndDelete(categoryId);

  res.status(204).json({
    status: "success",
    data: null
  });
});

//========================================================================================
// LEFTOVER MANAGEMENT
//========================================================================================

// Add a leftover
exports.addLeftover = catchAsync(async (req, res, next) => {
  const { item_name, category_id, unit_id, quantity, meal_id, expiry_date } = req.body;

  if (!item_name || !unit_id || (quantity === undefined || quantity === null) || !expiry_date) {
    return next(new AppError("Please provide item_name, unit_id, quantity, and expiry_date", 400));
  }

  // Verify category exists (optional)
  if (category_id) {
    const category = await InventoryCategory.findById(category_id);
    if (!category) {
      return next(new AppError("Category not found", 404));
    }
  }

  const leftover = await Leftover.create({
    member_mail: req.member.mail,
    family_id: req.familyAccount._id,
    item_name,
    category_id: category_id || null,
    unit_id,
    quantity,
    meal_id: meal_id || null,
    expiry_date
  });

  await leftover.populate(['category_id', 'unit_id']);

  res.status(201).json({
    status: "success",
    data: { leftover }
  });
});

//========================================================================================
// Get all leftovers for the family
exports.getAllLeftovers = catchAsync(async (req, res, next) => {
  const { expired } = req.query;

  const filter = { family_id: req.familyAccount._id };

  if (expired === 'false') {
    filter.expiry_date = { $gte: new Date() };
  } else if (expired === 'true') {
    filter.expiry_date = { $lt: new Date() };
  }

  const leftovers = await Leftover.find(filter)
    .populate('category_id')
    .populate('unit_id')
    .populate('meal_id')
    .sort({ expiry_date: 1 });

  res.status(200).json({
    status: "success",
    results: leftovers.length,
    data: { leftovers }
  });
});

//========================================================================================
// Update a leftover (e.g., quantity change after partial use)
exports.updateLeftover = catchAsync(async (req, res, next) => {
  const { leftoverId } = req.params;
  const { item_name, quantity, expiry_date, category_id, unit_id } = req.body;

  const leftover = await Leftover.findOne({
    _id: leftoverId,
    family_id: req.familyAccount._id
  });

  if (!leftover) {
    return next(new AppError("Leftover not found", 404));
  }

  if (item_name) leftover.item_name = item_name;
  if (quantity !== undefined) leftover.quantity = quantity;
  if (expiry_date) leftover.expiry_date = expiry_date;
  if (category_id) leftover.category_id = category_id;
  if (unit_id) leftover.unit_id = unit_id;

  await leftover.save();
  await leftover.populate(['category_id', 'unit_id']);

  res.status(200).json({
    status: "success",
    data: { leftover }
  });
});

//========================================================================================
// Delete a leftover
exports.deleteLeftover = catchAsync(async (req, res, next) => {
  const { leftoverId } = req.params;

  const leftover = await Leftover.findOne({
    _id: leftoverId,
    family_id: req.familyAccount._id
  });

  if (!leftover) {
    return next(new AppError("Leftover not found", 404));
  }

  await Leftover.findByIdAndDelete(leftoverId);

  res.status(204).json({
    status: "success",
    data: null
  });
});

//========================================================================================
// Get expiring leftovers (within 1 day)
exports.getExpiringLeftovers = catchAsync(async (req, res, next) => {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const expiring = await Leftover.find({
    family_id: req.familyAccount._id,
    expiry_date: { $gte: now, $lte: oneDayFromNow }
  })
    .populate('category_id')
    .populate('unit_id')
    .sort({ expiry_date: 1 });

  const expired = await Leftover.find({
    family_id: req.familyAccount._id,
    expiry_date: { $lt: now }
  })
    .populate('category_id')
    .populate('unit_id')
    .sort({ expiry_date: 1 });

  res.status(200).json({
    status: "success",
    data: {
      expiringSoon: {
        count: expiring.length,
        items: expiring
      },
      expired: {
        count: expired.length,
        items: expired
      }
    }
  });
});
