

// signup ,login ,logout ,protect,restrictTo,resetPassword
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const familyAccountModel = require("../models/FamilyAccountModel");
const memberModel = require("../models/MemberModel");
const memberTypeModel = require("../models/MemberTypeModel");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

  // Step 1: Create family account first
  const newAccount = await familyAccountModel.create({
    mail,
    password,
    Title,
    isActivated: true,
  });

  // Step 2: Create "Parent" member type for this family
  const parentType = await memberTypeModel.create({ 
    type: "Parent",
    family_id: newAccount._id
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

  // Check if the family account is deactivated
  if (!familyAccount.active) {
    return next(new AppError("This account has been deactivated. Please contact support to reactivate.", 403));
  }

  if (!familyAccount || !(await familyAccount.correctPassword(password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Step 4: Generate token and return user info
  const token = signToken({ id: familyAccount._id, member_id: member._id });

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

  // Check if the account is deactivated
  if (!familyAccount.active) {
    return next(new AppError("This account has been deactivated. Please contact support to reactivate.", 403));
  }
  
  // Attach family account and member_id to request for later use
  req.familyAccount = familyAccount;
  req.memberId = decode.member_id;
  
  next();
});

//========================================================================================

exports.restrictTo = (...memberTypes) => {
  return catchAsync(async (req, res, next) => {
    // Find the specific member who is making the request
    const member = await memberModel.findById(req.memberId)
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
//========================================================================================
// Forgot Password - generates and sends reset token
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { mail } = req.body;
  
  if (!mail) {
    return next(new AppError("Please provide your email address", 400));
  }

  // Step 1: Find family account by email
  const familyAccount = await familyAccountModel.findOne({ mail });
  
  if (!familyAccount) {
    return next(new AppError("No account found with that email address", 404));
  }

  // Step 2: Generate reset token
  const resetToken = familyAccount.createPasswordResetToken();
  await familyAccount.save({ validateBeforeSave: false });

  // Step 3: Create reset URL
  const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword/${resetToken}`;

  // Step 4: Send email with reset link
  try {
    // Configure email transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: mail,
      subject: 'Password Reset Request (Valid for 60 minutes)',
      text: `Forgot your password? Click this link to reset it: ${resetURL}\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetURL}">Reset Password</a>
        <p>This link is valid for 60 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "success",
      data: {
        message: "Password reset link sent to your email",
      },
    });
  } catch (error) {
    // If email fails, reset the token fields
    familyAccount.passwordResetToken = undefined;
    familyAccount.passwordResetExpires = undefined;
    await familyAccount.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Please try again later.", 500)
    );
  }
});

//========================================================================================
// Reset Password - uses token to change password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError("Please provide password and password confirmation", 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  // Step 1: Hash the token from URL to compare with database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Step 2: Find family account by token and check if not expired
  const familyAccount = await familyAccountModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!familyAccount) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Step 3: Update password
  familyAccount.password = password;
  familyAccount.passwordResetToken = undefined;
  familyAccount.passwordResetExpires = undefined;
  await familyAccount.save();

  // Step 4: Generate new JWT token and log user in
  const jwtToken = signToken({ id: familyAccount._id });

  res.status(200).json({
    message: "success",
    data: {
      message: "Password reset successful",
    },
    token: jwtToken,
  });
});