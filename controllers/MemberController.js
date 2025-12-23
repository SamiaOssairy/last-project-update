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
  
  // Check if member type exists for this family, if not create it
  let memberTypeDoc = await memberType.findOne({ type: member_type, family_id });
  if (!memberTypeDoc) {
    memberTypeDoc = await memberType.create({ type: member_type, family_id });
  }
  
  // Create the new member
  const newMember = await member.create({
    username,
    mail,
    family_id,
    member_type_id: memberTypeDoc._id,
    birth_date,
  });
  
  // Auto-create Point Wallet and Wishlist for new member
  const PointWallet = require("../models/point_walletModel");
  const Wishlist = require("../models/wishlistModel");
  
  // Try to create wallet and wishlist, but don't fail if they already exist
  try {
    await PointWallet.create({
      member_mail: mail,
      total_points: 0
    });
  } catch (err) {
    // Wallet might already exist, that's okay
    console.log("Note: PointWallet creation skipped:", err.message);
  }
  
  try {
    await Wishlist.create({
      member_mail: mail,
      title: `${username}'s Wishlist`
    });
  } catch (err) {
    // Wishlist might already exist, that's okay
    console.log("Note: Wishlist creation skipped:", err.message);
  }
  
  // Populate the response
  const populatedMember = await member.findById(newMember._id).populate('member_type_id');
  
  res.status(201).json({
    status: "success",
    data: { 
      member: populatedMember,
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

//========================================================================================
// Delete a member from the family (Parent only)
exports.deleteMember = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  const family_id = req.familyAccount._id;
  
  // Find the member to delete
  const memberToDelete = await member.findOne({ _id: memberId, family_id })
    .populate('member_type_id');
  
  if (!memberToDelete) {
    return next(new AppError("Member not found in your family", 404));
  }
  
  // Prevent deleting yourself
  if (memberToDelete._id.toString() === req.memberId.toString()) {
    return next(new AppError("You cannot remove yourself from the family", 400));
  }
  
  // Prevent deleting the last Parent
  if (memberToDelete.member_type_id.type === 'Parent') {
    const parentCount = await member.countDocuments({
      family_id,
      member_type_id: memberToDelete.member_type_id._id
    });
    
    if (parentCount <= 1) {
      return next(new AppError("Cannot delete the last parent in the family", 400));
    }
  }
  
  const memberMail = memberToDelete.mail;
  
  // Delete associated data
  const PointWallet = require("../models/point_walletModel");
  const Wishlist = require("../models/wishlistModel");
  const PointHistory = require("../models/point_historyModel");
  const WishlistItem = require("../models/wishlist_itemModel");
  
  try {
    // Delete point wallet
    await PointWallet.deleteOne({ member_mail: memberMail });
    
    // Delete point history
    await PointHistory.deleteMany({ member_mail: memberMail });
    
    // Find and delete wishlist items, then wishlist
    const wishlist = await Wishlist.findOne({ member_mail: memberMail });
    if (wishlist) {
      await WishlistItem.deleteMany({ wishlist_id: wishlist._id });
      await Wishlist.deleteOne({ member_mail: memberMail });
    }
  } catch (err) {
    console.log("Note: Error cleaning up member data:", err.message);
  }
  
  // Delete the member
  await member.findByIdAndDelete(memberId);
  
  res.status(200).json({
    status: "success",
    message: `Member ${memberToDelete.username} has been removed from the family`
  });
});



// get member info 






