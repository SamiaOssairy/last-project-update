const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const PointWallet = require("../models/point_walletModel");
const PointDetails = require("../models/point_historyModel");
const Member = require("../models/MemberModel");

//========================================================================================
// Get my point wallet
exports.getMyWallet = catchAsync(async (req, res, next) => {
  let wallet = await PointWallet.findOne({ member_mail: req.member.mail });
  
  if (!wallet) {
    // Create wallet if doesn't exist
    wallet = await PointWallet.create({ 
      member_mail: req.member.mail, 
      total_points: 0 
    });
  }
  
  res.status(200).json({
    status: "success",
    data: { wallet }
  });
});

//========================================================================================
// Get specific member's wallet (Parent can view any, others only their own)
exports.getMemberWallet = catchAsync(async (req, res, next) => {
  const { memberMail } = req.params;
  
  // Check if member belongs to family
  const member = await Member.findOne({ 
    mail: memberMail, 
    family_id: req.familyAccount._id 
  });
  
  if (!member) {
    return next(new AppError("Member not found in your family", 404));
  }
  
  let wallet = await PointWallet.findOne({ member_mail: memberMail });
  
  if (!wallet) {
    wallet = await PointWallet.create({ 
      member_mail: memberMail, 
      total_points: 0 
    });
  }
  
  res.status(200).json({
    status: "success",
    data: { wallet }
  });
});

//========================================================================================
// Manual point adjustment (Parent only)
exports.manualAdjustment = catchAsync(async (req, res, next) => {
  const { member_mail, points_amount, description } = req.body;
  
  if (!member_mail || !points_amount || !description) {
    return next(new AppError("Please provide member_mail, points_amount, and description", 400));
  }
  
  // Verify member belongs to family
  const member = await Member.findOne({ 
    mail: member_mail, 
    family_id: req.familyAccount._id 
  });
  
  if (!member) {
    return next(new AppError("Member not found in your family", 404));
  }
  
  let wallet = await PointWallet.findOne({ member_mail });
  if (!wallet) {
    wallet = await PointWallet.create({ 
      member_mail, 
      total_points: 0 
    });
  }
  
  // Update wallet (ensure doesn't go negative)
  wallet.total_points = Math.max(0, wallet.total_points + points_amount);
  await wallet.save();
  
  // Create history entry
  await PointDetails.create({
    wallet_id: wallet._id,
    member_mail,
    points_amount,
    reason_type: points_amount > 0 ? 'manual_grant' : 'adjustment',
    granted_by: req.member.mail,
    description
  });
  
  res.status(200).json({
    status: "success",
    message: `Points ${points_amount > 0 ? 'added' : 'deducted'} successfully`,
    data: { wallet }
  });
});

//========================================================================================
// Get points ranking/leaderboard
exports.getPointsRanking = catchAsync(async (req, res, next) => {
  // Get all members in family
  const members = await Member.find({ family_id: req.familyAccount._id })
    .populate('member_type_id', 'type')
    .select('username mail birth_date');
  
  // Get all wallets
  const wallets = await PointWallet.find({ 
    member_mail: { $in: members.map(m => m.mail) } 
  }).sort({ total_points: -1 });
  
  // Combine data
  const ranking = wallets.map((wallet, index) => {
    const member = members.find(m => m.mail === wallet.member_mail);
    return {
      rank: index + 1,
      username: member?.username,
      mail: member?.mail,
      member_type: member?.member_type_id?.type,
      total_points: wallet.total_points
    };
  });
  
  res.status(200).json({
    status: "success",
    data: { ranking }
  });
});
