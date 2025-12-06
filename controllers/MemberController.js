const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const member = require("../models/MemberModel");
const memberType=require ("../models/MemberTypeModel");
const memberTypeController=require("./MemberTypeController");
//========================================================================================

exports.createMember = catchAsync(async (req, res, next) => {
  const { mail, username, birth_date, member_type } = req.body;
  
  // Validate required fields
  if (!mail || !username || !birth_date || !member_type) {
    return next(new AppError("Please provide all required fields: mail, username, birth_date, member_type", 400));
  }
  
  // Get the parent's family account from the protected middleware
  const family_id = req.familyAccount._id;
  
  // Check if mail already exists in this family
  const existingMember = await member.findOne({ mail, family_id });
  if (existingMember) {
    return next(new AppError("A member with this email already exists in your family", 400));
  }
  
  // Check if member type exists, if not create it
  let memberTypeDoc = await memberType.findOne({ type: member_type });
  if (!memberTypeDoc) {
    memberTypeDoc = await memberType.create({ type: member_type });
  }
  
  // Create the new member
  const newMember = await member.create({
    username,
    mail,
    family_id,
    member_type_id: memberTypeDoc._id,
    birth_date,
  });
  
  // Populate the response
  await newMember.populate('member_type_id');
  
  res.status(201).json({
    status: "success",
    data: { 
      member: newMember,
      message: `Member created successfully. They can login with email: ${mail} and the family account password.`
    },
  });
});
//========================================================================================
exports.getAllMembers = catchAsync(async (req, res, next) => {
  // Get members only from the authenticated user's family
  const family_id = req.familyAccount._id;
  
  const members = await member.find({ family_id })
    .populate('member_type_id');
  
  res.status(200).json({  
    status: "success",
    results: members.length,
    data: { members },
  });
});










