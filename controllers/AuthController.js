

// signup ,login ,logout ,protect,restrictTo,resetPassword
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const familyAccountModel = require("../models/FamilyAccountModel");
const memberModel = require("../models/MemberModel");
const memberTypeModel = require("../models/MemberTypeModel");

//========================================================================================

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//========================================================================================

// automatically add mail of parent to members when signing up
exports.signUp = catchAsync(async (req, res, next) => {
  const { mail, password, Title, username, birth_date } = req.body;
  
  // Validate required fields
  if (!mail || !password || !Title || !username || !birth_date) {
    return next(new AppError("Please provide all required fields: mail, password, Title, username, birth_date", 400));
  }

  // Step 1: Ensure "Parent" member type exists
  let parentType = await memberTypeModel.findOne({ type: "Parent" });
  if (!parentType) {
    parentType = await memberTypeModel.create({ type: "Parent" });
  }

  // Step 2: Create family account
  const newAccount = await familyAccountModel.create({
    mail,
    password,
    Title,
    isActivated: true,
  });

  // Step 3: Create parent member
  const newMember = await memberModel.create({
    username,
    mail,
    family_id: newAccount._id,
    member_type_id: parentType._id,
    birth_date,
  });

  const token = signToken({ id: newAccount._id });
  
  res.status(201).json({
    message: "success",
    data: {
      username: newMember.username,
      familyTitle: newAccount.Title,
      memberType: parentType.type,
      account: newAccount,
      member: newMember,
    },
    token,
  });
});

//========================================================================================

// go search for mails in members ,then check for the family he belong to (if it is activated or not )
// , then go to memberType to check for the type of this member
exports.login = catchAsync(async (req, res, next) => {
  const { mail, password } = req.body;
  
  if (!mail || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Step 1: Find the member with this mail
  const member = await memberModel.findOne({ mail })
    .populate('family_id')
    .populate('member_type_id');

  if (!member) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Step 2: Check if the family account is activated
  if (!member.family_id.isActivated) {
    return next(new AppError("This family account is not activated", 403));
  }

  // Step 3: Get the family account with password to verify
  const familyAccount = await familyAccountModel.findById(member.family_id._id).select('+password');

  if (!familyAccount || !(await familyAccount.correctPassword(password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Step 4: Generate token and return user info
  const token = signToken({ id: familyAccount._id });

  res.status(200).json({
    message: "success",
    data: {
      username: member.username,
      familyTitle: familyAccount.Title,
      memberType: member.member_type_id.type,
    },
    token,
  });
});

//========================================================================================

exports.protect = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return next(
      new AppError("You are not logged in! please log in to get access", 401)
    );
  }
  
  const token = req.headers.authorization.split(" ")[1]; // Bearer token => [Bearer , token]
  const decode = await jwt.verify(token, process.env.JWT_SECRET);
  
  // Get the family account
  const familyAccount = await familyAccountModel.findById(decode.id);
  if (!familyAccount) {
    return next(new AppError("Family account no longer exists", 404));
  }
  
  // Attach family account to request for later use
  req.familyAccount = familyAccount;
  
  next();
});

//========================================================================================

exports.restrictTo = (...memberTypes) => {
  return catchAsync(async (req, res, next) => {
    // Find the member who is making the request
    const member = await memberModel.findOne({ family_id: req.familyAccount._id })
      .populate('member_type_id');
    
    if (!member) {
      return next(new AppError("Member not found", 404));
    }
    
    // Check if member type is allowed
    if (!memberTypes.includes(member.member_type_id.type)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    
    // Attach member to request for later use
    req.member = member;
    next();
  });
};
