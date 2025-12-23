const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const PointDetails = require("../models/point_historyModel");
const Member = require("../models/MemberModel");
const MemberType = require("../models/MemberTypeModel");

//========================================================================================
// Get my point history
exports.getMyPointHistory = catchAsync(async (req, res, next) => {
  const history = await PointDetails.find({ member_mail: req.member.mail })
    .populate('granted_by', 'username mail')
    .populate('task_id', 'title')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: "success",
    results: history.length,
    data: { history }
  });
});

//========================================================================================
// Get specific member's point history (Parent only)
exports.getMemberPointHistory = catchAsync(async (req, res, next) => {
  const { memberMail } = req.params;
  
  // Verify member belongs to family
  const member = await Member.findOne({ 
    mail: memberMail, 
    family_id: req.familyAccount._id 
  });
  
  if (!member) {
    return next(new AppError("Member not found in your family", 404));
  }
  
  const history = await PointDetails.find({ member_mail: memberMail })
    .populate('granted_by', 'username mail')
    .populate('task_id', 'title')
    .populate('redeem_id')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: "success",
    results: history.length,
    data: { history }
  });
});

//========================================================================================
// Get all point history for family (Parent only)
exports.getAllPointHistory = catchAsync(async (req, res, next) => {
  // Get all family members
  const members = await Member.find({ family_id: req.familyAccount._id });
  const memberMails = members.map(m => m.mail);
  
  const history = await PointDetails.find({ member_mail: { $in: memberMails } })
    .populate('member_mail', 'username mail')
    .populate('granted_by', 'username mail')
    .populate('task_id', 'title')
    .populate('redeem_id')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: "success",
    results: history.length,
    data: { history }
  });
});
