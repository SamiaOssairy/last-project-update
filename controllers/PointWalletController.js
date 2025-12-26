const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const PointWallet = require("../models/point_walletModel");
const PointDetails = require("../models/point_historyModel");
const Member = require("../models/MemberModel");

//========================================================================================
// Initialize wallets for all family members (creates if not exists)
exports.initializeWallets = catchAsync(async (req, res, next) => {
  // Get all members in family
  const members = await Member.find({ family_id: req.familyAccount._id });
  
  const created = [];
  const existing = [];
  
  for (const member of members) {
    const existingWallet = await PointWallet.findOne({ member_mail: member.mail });
    if (existingWallet) {
      existing.push(member.mail);
    } else {
      await PointWallet.create({
        member_mail: member.mail,
        total_points: 0
      });
      created.push(member.mail);
    }
  }
  
  res.status(200).json({
    status: "success",
    message: `Wallets initialized. Created: ${created.length}, Already existed: ${existing.length}`,
    data: { created, existing }
  });
});

//========================================================================================
// Get my point wallet
exports.getMyWallet = catchAsync(async (req, res, next) => {
  const memberMail = req.member?.mail;
  
  if (!memberMail) {
    return next(new AppError("Member email not found", 400));
  }
  
  let wallet = await PointWallet.findOne({ member_mail: memberMail });
  
  if (!wallet) {
    // Create wallet if doesn't exist
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
  if (!req.familyAccount || !req.familyAccount._id) {
    return next(new AppError("Family account not found", 400));
  }
  
  // Get all members in family
  const members = await Member.find({ family_id: req.familyAccount._id })
    .populate('member_type_id', 'type')
    .select('username mail');
  
  if (!members || members.length === 0) {
    return res.status(200).json({
      status: "success",
      data: { ranking: [] }
    });
  }
  
  // Get member emails
  const memberEmails = members.map(m => m.mail);
  
  // Get all wallets for these members
  const wallets = await PointWallet.find({ 
    member_mail: { $in: memberEmails } 
  });
  
  // Create a map of wallets by email for quick lookup
  const walletMap = {};
  wallets.forEach(w => {
    walletMap[w.member_mail] = w.total_points || 0;
  });
  
  // Combine data - include ALL members (0 points if no wallet)
  const ranking = members.map(member => {
    return {
      username: member.username || 'Unknown',
      mail: member.mail,
      member_type: member.member_type_id?.type || 'Member',
      total_points: walletMap[member.mail] || 0
    };
  });
  
  // Sort by points descending
  ranking.sort((a, b) => b.total_points - a.total_points);
  
  // Add rank
  ranking.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  res.status(200).json({
    status: "success",
    data: { ranking }
  });
});
