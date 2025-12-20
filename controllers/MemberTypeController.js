const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const memberType = require("../models/MemberTypeModel");
//========================================================================================

exports.createMemberType = catchAsync(async (req, res, next) => {
  const { type } = req.body;
  
  // Create member type for the logged-in user's family
  const newMemberType = await memberType.create({
    type,
    family_id: req.familyAccount._id
  });
  
  res.status(201).json({
    status: "success",
    data: { newMemberType },
  });
});
//========================================================================================
exports.getAllMemberTypes = catchAsync(async (req, res, next) => {
  // Get member types for the logged-in user's family only
  const memberTypes = await memberType.find({ family_id: req.familyAccount._id });
  
  res.status(200).json({
    status: "success",
    results: memberTypes.length,
    data: { memberTypes },
  });
});
//========================================================================================

exports.addPermissionsToMemberType = catchAsync(async (req, res, next) => {
  const { memberTypeId } = req.params;
  const { permissions } = req.body; // expecting an array of permissions

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return next(
      new AppError("Please provide a non-empty array of permissions", 400)
    );
  }
  const memberType = await memberType.findById(memberTypeId);

  if (!memberType) {
    return next(new AppError("Member type not found", 404));
  }
  memberType.Permissions = permissions;
  await memberType.save();

  res.status(200).json({
    status: "success",
    data: { memberType },
  });
});


