 
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const FamilyAccount = require("../models/FamilyAccountModel");
 
exports.deactivateFamilyAccount = catchAsync(async (req, res, next) => {
  const { mail, password } = req.body;

  // Validate that mail and password are provided
  if (!mail || !password) {
    return next(new AppError("Please provide email and password to deactivate account", 400));
  }

  // Find the family account with password field (need to explicitly select it)
  const familyAccount = await FamilyAccount.findById(req.familyAccount._id).select('+password');
  
  if (!familyAccount) {
    return next(new AppError("Family account not found", 404));
  }

  // Check if the account is already deactivated
  if (!familyAccount.active) {
    return next(new AppError("This account is already deactivated", 400));
  }

  // Verify that the provided email matches the family account
  if (familyAccount.mail !== mail) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Verify the password
  const isPasswordCorrect = await familyAccount.correctPassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Deactivate the family account
  familyAccount.active = false;
  await familyAccount.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Family account deactivated successfully",
  });
});














