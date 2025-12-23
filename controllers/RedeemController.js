const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const Redeem = require("../models/redeemModel");
const WishlistItem = require("../models/wishlist_itemModel");
const PointWallet = require("../models/point_walletModel");
const PointDetails = require("../models/point_historyModel");
const Member = require("../models/MemberModel");
const MemberType = require("../models/MemberTypeModel");

//========================================================================================
// Request redemption (any member can request)
// Can be for wishlist item OR custom request (school trip, event, etc.)
exports.requestRedemption = catchAsync(async (req, res, next) => {
  const { wishlist_item_id, request_details, point_deduction } = req.body;
  
  if (!request_details) {
    return next(new AppError("Please provide request details (what you want to redeem)", 400));
  }
  
  let finalPointDeduction = 0;
  let itemDetails = null;
  
  if (wishlist_item_id) {
    // OPTION 1: Redeeming a specific wishlist item
    const item = await WishlistItem.findById(wishlist_item_id)
      .populate('wishlist_id');
    
    if (!item) {
      return next(new AppError("Wishlist item not found", 404));
    }
    
    // Verify item belongs to requester
    if (item.wishlist_id.member_mail !== req.member.mail) {
      return next(new AppError("You can only redeem your own wishlist items", 403));
    }
    
    if (item.status !== 'active') {
      return next(new AppError("This item is not available for redemption", 400));
    }
    
    finalPointDeduction = item.required_points;
    itemDetails = item;
  } else {
    // OPTION 2: Custom redemption request (school trip, event tickets, etc.)
    if (!point_deduction || point_deduction <= 0) {
      return next(new AppError("Please provide valid point_deduction amount for custom redemption", 400));
    }
    finalPointDeduction = point_deduction;
  }
  
  // Check if member has enough points
  const wallet = await PointWallet.findOne({ member_mail: req.member.mail });
  if (!wallet || wallet.total_points < finalPointDeduction) {
    return next(new AppError(`Insufficient points. You have ${wallet?.total_points || 0} points but need ${finalPointDeduction} points.`, 400));
  }
  
  const redeemRequest = await Redeem.create({
    requester: req.member.mail,
    status: 'pending',
    request_details,
    point_deduction: finalPointDeduction,
    wishlist_item_id: wishlist_item_id || null,
    requested_at: Date.now()
  });
  
  const message = wishlist_item_id 
    ? `Redemption request for "${itemDetails.item_name}" submitted. Waiting for parent approval.`
    : `Custom redemption request for ${finalPointDeduction} points submitted. Waiting for parent approval.`;
  
  res.status(201).json({
    status: "success",
    message,
    data: { redeemRequest }
  });
});

//========================================================================================
// Get my redemption requests
exports.getMyRedemptions = catchAsync(async (req, res, next) => {
  const redemptions = await Redeem.find({ requester: req.member.mail })
    .populate('approver', 'username mail')
    .populate('wishlist_item_id')
    .sort({ requested_at: -1 });
  
  res.status(200).json({
    status: "success",
    results: redemptions.length,
    data: { redemptions }
  });
});

//========================================================================================
// Get all pending redemption requests (Parent only)
exports.getPendingRedemptions = catchAsync(async (req, res, next) => {
  // Get all family members
  const members = await Member.find({ family_id: req.familyAccount._id });
  const memberMails = members.map(m => m.mail);
  
  const redemptions = await Redeem.find({ 
    requester: { $in: memberMails },
    status: 'pending'
  })
    .populate('requester', 'username mail')
    .populate('wishlist_item_id')
    .sort({ requested_at: -1 });
  
  res.status(200).json({
    status: "success",
    results: redemptions.length,
    data: { pendingRedemptions: redemptions }
  });
});

//========================================================================================
// Get all redemption requests for family (Parent only)
exports.getAllRedemptions = catchAsync(async (req, res, next) => {
  const members = await Member.find({ family_id: req.familyAccount._id });
  const memberMails = members.map(m => m.mail);
  
  const redemptions = await Redeem.find({ 
    requester: { $in: memberMails }
  })
    .populate('requester', 'username mail')
    .populate('approver', 'username mail')
    .populate('wishlist_item_id')
    .sort({ requested_at: -1 });
  
  res.status(200).json({
    status: "success",
    results: redemptions.length,
    data: { redemptions }
  });
});

//========================================================================================
// Parent approves redemption request (Step 1: Parent approval)
exports.parentApproveRedemption = catchAsync(async (req, res, next) => {
  const { redeemId } = req.params;
  const { approved, rejection_reason } = req.body;
  
  if (approved === undefined) {
    return next(new AppError("Please provide approval status (approved: true/false)", 400));
  }
  
  const redeemRequest = await Redeem.findById(redeemId)
    .populate('requester', 'username mail')
    .populate('wishlist_item_id');
  
  if (!redeemRequest) {
    return next(new AppError("Redemption request not found", 404));
  }
  
  // Verify requester belongs to family
  const member = await Member.findOne({ 
    mail: redeemRequest.requester.mail, 
    family_id: req.familyAccount._id 
  });
  
  if (!member) {
    return next(new AppError("This request doesn't belong to your family", 403));
  }
  
  if (redeemRequest.status !== 'pending') {
    return next(new AppError(`This request has already been ${redeemRequest.status}`, 400));
  }
  
  if (approved) {
    // Parent approves - now waiting for child to accept
    redeemRequest.status = 'parent_approved';
    redeemRequest.approver = req.member.mail;
    redeemRequest.parent_approved_at = Date.now();
    await redeemRequest.save();
    
    res.status(200).json({
      status: "success",
      message: "Redemption approved. Waiting for child to accept.",
      data: { redeemRequest }
    });
  } else {
    // Parent rejects
    redeemRequest.status = 'rejected';
    redeemRequest.approver = req.member.mail;
    redeemRequest.rejection_reason = rejection_reason || 'Rejected by parent';
    await redeemRequest.save();
    
    res.status(200).json({
      status: "success",
      message: "Redemption request rejected",
      data: { redeemRequest }
    });
  }
});

//========================================================================================
// Get parent-approved redemptions waiting for child acceptance
exports.getApprovedWaitingAcceptance = catchAsync(async (req, res, next) => {
  const redemptions = await Redeem.find({ 
    requester: req.member.mail,
    status: 'parent_approved'
  })
    .populate('approver', 'username mail')
    .populate('wishlist_item_id')
    .sort({ parent_approved_at: -1 });
  
  res.status(200).json({
    status: "success",
    results: redemptions.length,
    data: { approvedRedemptions: redemptions }
  });
});

//========================================================================================
// Child accepts/rejects parent-approved redemption (Step 2: Child acceptance)
exports.childAcceptRedemption = catchAsync(async (req, res, next) => {
  const { redeemId } = req.params;
  const { accept } = req.body;
  
  if (accept === undefined) {
    return next(new AppError("Please provide acceptance status (accept: true/false)", 400));
  }
  
  const redeemRequest = await Redeem.findById(redeemId)
    .populate('wishlist_item_id');
  
  if (!redeemRequest) {
    return next(new AppError("Redemption request not found", 404));
  }
  
  // Only the requester can accept/reject
  if (redeemRequest.requester !== req.member.mail) {
    return next(new AppError("You can only accept/reject your own redemption requests", 403));
  }
  
  if (redeemRequest.status !== 'parent_approved') {
    return next(new AppError("This request is not in parent_approved status", 400));
  }
  
  if (accept) {
    // Child accepts - deduct points
    const wallet = await PointWallet.findOne({ member_mail: req.member.mail });
    
    if (!wallet || wallet.total_points < redeemRequest.point_deduction) {
      return next(new AppError("Insufficient points for redemption", 400));
    }
    
    // Deduct points
    wallet.total_points -= redeemRequest.point_deduction;
    await wallet.save();
    
    // Create point history
    await PointDetails.create({
      wallet_id: wallet._id,
      member_mail: req.member.mail,
      points_amount: -redeemRequest.point_deduction,
      reason_type: 'redeem',
      redeem_id: redeemRequest._id,
      granted_by: redeemRequest.approver,
      description: `Redeemed: ${redeemRequest.request_details}`
    });
    
    // Update redemption status
    redeemRequest.status = 'child_accepted';
    redeemRequest.child_accepted_at = Date.now();
    await redeemRequest.save();
    
    // Update wishlist item if applicable
    if (redeemRequest.wishlist_item_id) {
      const item = await WishlistItem.findById(redeemRequest.wishlist_item_id);
      if (item) {
        item.status = 'redeemed';
        await item.save();
      }
    }
    
    res.status(200).json({
      status: "success",
      message: `Redemption completed! ${redeemRequest.point_deduction} points deducted.`,
      data: { 
        redeemRequest,
        wallet 
      }
    });
  } else {
    // Child cancels
    redeemRequest.status = 'cancelled';
    redeemRequest.rejection_reason = 'Cancelled by requester';
    await redeemRequest.save();
    
    res.status(200).json({
      status: "success",
      message: "Redemption cancelled",
      data: { redeemRequest }
    });
  }
});

//========================================================================================
// Cancel my redemption request (before parent approval)
exports.cancelRedemption = catchAsync(async (req, res, next) => {
  const { redeemId } = req.params;
  
  const redeemRequest = await Redeem.findById(redeemId);
  
  if (!redeemRequest) {
    return next(new AppError("Redemption request not found", 404));
  }
  
  if (redeemRequest.requester !== req.member.mail) {
    return next(new AppError("You can only cancel your own redemption requests", 403));
  }
  
  if (redeemRequest.status !== 'pending') {
    return next(new AppError("You can only cancel pending requests", 400));
  }
  
  redeemRequest.status = 'cancelled';
  redeemRequest.rejection_reason = 'Cancelled by requester';
  await redeemRequest.save();
  
  res.status(200).json({
    status: "success",
    message: "Redemption request cancelled"
  });
});
