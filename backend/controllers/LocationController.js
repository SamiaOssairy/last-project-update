const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const LocationShare = require("../models/locationShareModel");
const LocationPermission = require("../models/locationPermissionModel");
const LocationHistory = require("../models/locationHistoryModel");
const LocationAlert = require("../models/locationAlertModel");
const SharedLocation = require("../models/sharedLocationModel");
const Member = require("../models/MemberModel");
const MemberType = require("../models/MemberTypeModel");

//========================================================================================
// LOCATION SHARING
//========================================================================================

// Update my location
exports.updateLocation = catchAsync(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return next(new AppError("Please provide latitude and longitude", 400));
  }

  // Upsert location share record
  const locationShare = await LocationShare.findOneAndUpdate(
    { member_mail: req.member.mail },
    {
      member_mail: req.member.mail,
      family_id: req.familyAccount._id,
      latitude,
      longitude,
      last_updated: Date.now(),
      is_sharing_enabled: true
    },
    { upsert: true, new: true }
  );

  // Save to location history
  await LocationHistory.create({
    member_mail: req.member.mail,
    family_id: req.familyAccount._id,
    latitude,
    longitude
  });

  res.status(200).json({
    status: "success",
    data: { location: locationShare }
  });
});

//========================================================================================
// Toggle my location sharing on/off
exports.toggleSharing = catchAsync(async (req, res, next) => {
  const enabled =
    req.body.enabled !== undefined
      ? req.body.enabled
      : req.body.is_sharing_enabled;

  if (enabled === undefined) {
    return next(new AppError("Please provide enabled or is_sharing_enabled (true/false)", 400));
  }

  const locationShare = await LocationShare.findOneAndUpdate(
    { member_mail: req.member.mail },
    { is_sharing_enabled: enabled },
    { new: true }
  );

  if (!locationShare) {
    return next(new AppError("No location record found. Please update your location first.", 404));
  }

  // Alert all parents in the same family when a member disables sharing.
  if (!enabled) {
    const familyMembers = await Member.find({
      family_id: req.familyAccount._id
    }).populate('member_type_id').select('mail member_type_id');

    const parentRecipients = familyMembers
      .filter(
        (m) =>
          m.mail !== req.member.mail &&
          m.member_type_id &&
          m.member_type_id.type === 'Parent'
      )
      .map((m) => m.mail);

    if (parentRecipients.length > 0) {
      await LocationAlert.insertMany(
        parentRecipients.map((mail) => ({
          member_mail: mail,
          family_id: req.familyAccount._id,
          alert_type: 'sharing_disabled',
          message: `${req.member.username} turned off location sharing`,
          latitude: locationShare.latitude,
          longitude: locationShare.longitude
        }))
      );
    }
  }

  res.status(200).json({
    status: "success",
    message: `Location sharing ${enabled ? 'enabled' : 'disabled'}`,
    data: { location: locationShare }
  });
});

//========================================================================================
// Get my location
exports.getMyLocation = catchAsync(async (req, res, next) => {
  const location = await LocationShare.findOne({ member_mail: req.member.mail });

  res.status(200).json({
    status: "success",
    data: { location: location || null }
  });
});

//========================================================================================
// Get family members with last-known location (online or offline)
exports.getFamilyLocations = catchAsync(async (req, res, next) => {
  const familyId = req.familyAccount._id;

  const [members, locations] = await Promise.all([
    Member.find({ family_id: familyId })
      .populate('member_type_id')
      .select('username mail member_type_id'),
    LocationShare.find({ family_id: familyId })
  ]);

  const locationByMail = new Map(locations.map((loc) => [loc.member_mail, loc]));

  const enrichedLocations = members.map((member) => {
    const loc = locationByMail.get(member.mail);
    return {
      member_mail: member.mail,
      member_username: member.username,
      member_type: member.member_type_id ? member.member_type_id.type : 'Unknown',
      latitude: loc ? loc.latitude : null,
      longitude: loc ? loc.longitude : null,
      last_updated: loc ? loc.last_updated : null,
      is_sharing_enabled: loc ? loc.is_sharing_enabled : false,
      has_location: !!loc
    };
  });

  res.status(200).json({
    status: "success",
    results: enrichedLocations.length,
    data: { locations: enrichedLocations }
  });
});

//========================================================================================
// LOCATION PERMISSIONS
//========================================================================================

// Request permission to view someone's location
exports.requestPermission = catchAsync(async (req, res, next) => {
  const { target_mail } = req.body;

  if (!target_mail) {
    return next(new AppError("Please provide target_mail", 400));
  }

  // Can't request to view own location
  if (target_mail === req.member.mail) {
    return next(new AppError("You cannot request permission to view your own location", 400));
  }

  // Verify target member is in the same family
  const targetMember = await Member.findOne({
    mail: target_mail,
    family_id: req.familyAccount._id
  });

  if (!targetMember) {
    return next(new AppError("Member not found in your family", 404));
  }

  // Check if permission already exists
  const existing = await LocationPermission.findOne({
    requester_mail: req.member.mail,
    target_mail,
    family_id: req.familyAccount._id
  });

  if (existing) {
    return res.status(200).json({
      status: "success",
      message: `Permission already ${existing.permission_status}`,
      data: { permission: existing }
    });
  }

  // If requester is a Parent and target is a child (non-Parent), auto-approve
  const requesterType = await MemberType.findById(req.member.member_type_id);
  const targetType = await MemberType.findById(targetMember.member_type_id);
  const autoApprove = requesterType.type === 'Parent' && targetType.type !== 'Parent';

  const permission = await LocationPermission.create({
    requester_mail: req.member.mail,
    target_mail,
    family_id: req.familyAccount._id,
    permission_status: autoApprove ? 'approved' : 'pending'
  });

  res.status(201).json({
    status: "success",
    message: autoApprove
      ? "Permission auto-approved (Parent viewing child)"
      : "Permission request sent. Waiting for approval.",
    data: { permission }
  });
});

//========================================================================================
// Respond to a permission request (approve/deny)
exports.respondPermission = catchAsync(async (req, res, next) => {
  const { permissionId } = req.params;
  const { status } = req.body; // 'approved' or 'denied'

  if (!status || !['approved', 'denied'].includes(status)) {
    return next(new AppError("Please provide status: 'approved' or 'denied'", 400));
  }

  const permission = await LocationPermission.findOne({
    _id: permissionId,
    target_mail: req.member.mail, // Only the target can respond
    family_id: req.familyAccount._id
  });

  if (!permission) {
    return next(new AppError("Permission request not found", 404));
  }

  if (permission.permission_status !== 'pending') {
    return next(new AppError(`Permission already ${permission.permission_status}`, 400));
  }

  permission.permission_status = status;
  await permission.save();

  res.status(200).json({
    status: "success",
    message: `Permission ${status}`,
    data: { permission }
  });
});

//========================================================================================
// Get my incoming permission requests (requests TO me)
exports.getMyPermissionRequests = catchAsync(async (req, res, next) => {
  const permissions = await LocationPermission.find({
    target_mail: req.member.mail,
    family_id: req.familyAccount._id
  }).sort({ requested_at: -1 });

  // Enrich with requester info
  const enriched = [];
  for (const perm of permissions) {
    const requester = await Member.findOne({ mail: perm.requester_mail });
    enriched.push({
      ...perm.toObject(),
      requester_username: requester ? requester.username : 'Unknown'
    });
  }

  res.status(200).json({
    status: "success",
    results: enriched.length,
    data: { permissions: enriched }
  });
});

//========================================================================================
// Get my outgoing permission requests (requests FROM me)
exports.getMyOutgoingRequests = catchAsync(async (req, res, next) => {
  const permissions = await LocationPermission.find({
    requester_mail: req.member.mail,
    family_id: req.familyAccount._id
  }).sort({ requested_at: -1 });

  // Enrich with target info
  const enriched = [];
  for (const perm of permissions) {
    const target = await Member.findOne({ mail: perm.target_mail });
    enriched.push({
      ...perm.toObject(),
      target_username: target ? target.username : 'Unknown'
    });
  }

  res.status(200).json({
    status: "success",
    results: enriched.length,
    data: { permissions: enriched }
  });
});

//========================================================================================
// Revoke a permission (by either party)
exports.revokePermission = catchAsync(async (req, res, next) => {
  const { permissionId } = req.params;

  const permission = await LocationPermission.findOne({
    _id: permissionId,
    family_id: req.familyAccount._id,
    $or: [
      { requester_mail: req.member.mail },
      { target_mail: req.member.mail }
    ]
  });

  if (!permission) {
    return next(new AppError("Permission not found", 404));
  }

  await LocationPermission.findByIdAndDelete(permissionId);

  res.status(204).json({
    status: "success",
    data: null
  });
});

//========================================================================================
// LOCATION HISTORY
//========================================================================================

// Get location history for a member (with date range filter)
exports.getLocationHistory = catchAsync(async (req, res, next) => {
  const { member_mail, start_date, end_date } = req.query;
  const targetMail = member_mail || req.member.mail;

  // If requesting another member's history, check permissions
  if (targetMail !== req.member.mail) {
    const memberType = await MemberType.findById(req.member.member_type_id);
    const isParent = memberType && memberType.type === 'Parent';

    if (!isParent) {
      const permission = await LocationPermission.findOne({
        requester_mail: req.member.mail,
        target_mail: targetMail,
        family_id: req.familyAccount._id,
        permission_status: 'approved'
      });
      if (!permission) {
        return next(new AppError("You don't have permission to view this member's history", 403));
      }
    }
  }

  const query = {
    member_mail: targetMail,
    family_id: req.familyAccount._id
  };

  if (start_date || end_date) {
    query.recorded_at = {};
    if (start_date) query.recorded_at.$gte = new Date(start_date);
    if (end_date) query.recorded_at.$lte = new Date(end_date);
  }

  const history = await LocationHistory.find(query)
    .sort({ recorded_at: -1 })
    .limit(500);

  res.status(200).json({
    status: "success",
    results: history.length,
    data: { history }
  });
});

// Delete location history for a member (own history only or Parent)
exports.deleteLocationHistory = catchAsync(async (req, res, next) => {
  const { member_mail } = req.query;
  const targetMail = member_mail || req.member.mail;

  if (targetMail !== req.member.mail) {
    const memberType = await MemberType.findById(req.member.member_type_id);
    if (!memberType || memberType.type !== 'Parent') {
      return next(new AppError("Only parents can delete other members' history", 403));
    }
  }

  await LocationHistory.deleteMany({
    member_mail: targetMail,
    family_id: req.familyAccount._id
  });

  res.status(204).json({
    status: "success",
    data: null
  });
});

//========================================================================================
// LOCATION ALERTS
//========================================================================================

// Create a location alert (SOS, geofence, etc.)
exports.createLocationAlert = catchAsync(async (req, res, next) => {
  const { alert_type, message, latitude, longitude, target_mail } = req.body;

  if (!alert_type || !message) {
    return next(new AppError("Please provide alert_type and message", 400));
  }

  // For SOS alerts, create alert for ALL family members
  if (alert_type === 'sos') {
    const familyMembers = await Member.find({
      family_id: req.familyAccount._id,
      mail: { $ne: req.member.mail }
    });

    const alerts = await LocationAlert.insertMany(
      familyMembers.map(m => ({
        member_mail: m.mail,
        family_id: req.familyAccount._id,
        alert_type,
        message: `EMERGENCY: ${req.member.username} needs help! ${message}`,
        latitude: latitude || null,
        longitude: longitude || null
      }))
    );

    return res.status(201).json({
      status: "success",
      message: `SOS alert sent to ${alerts.length} family members`,
      data: { alerts }
    });
  }

  // For other alerts, create for specific target or self
  const recipientMail = target_mail || req.member.mail;

  const alert = await LocationAlert.create({
    member_mail: recipientMail,
    family_id: req.familyAccount._id,
    alert_type,
    message,
    latitude: latitude || null,
    longitude: longitude || null
  });

  res.status(201).json({
    status: "success",
    data: { alert }
  });
});

// Get my alerts
exports.getMyAlerts = catchAsync(async (req, res, next) => {
  const { unread_only } = req.query;

  const query = {
    member_mail: req.member.mail,
    family_id: req.familyAccount._id
  };

  if (unread_only === 'true') {
    query.is_read = false;
  }

  const alerts = await LocationAlert.find(query)
    .sort({ created_at: -1 })
    .limit(100);

  res.status(200).json({
    status: "success",
    results: alerts.length,
    data: { alerts }
  });
});

// Mark alert as read
exports.markAlertRead = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;

  const alert = await LocationAlert.findOneAndUpdate(
    {
      _id: alertId,
      member_mail: req.member.mail
    },
    { is_read: true },
    { new: true }
  );

  if (!alert) {
    return next(new AppError("Alert not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { alert }
  });
});

// Mark all alerts as read
exports.markAllAlertsRead = catchAsync(async (req, res, next) => {
  await LocationAlert.updateMany(
    {
      member_mail: req.member.mail,
      family_id: req.familyAccount._id,
      is_read: false
    },
    { is_read: true }
  );

  res.status(200).json({
    status: "success",
    message: "All alerts marked as read"
  });
});

// Delete an alert
exports.deleteAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;

  const alert = await LocationAlert.findOneAndDelete({
    _id: alertId,
    member_mail: req.member.mail
  });

  if (!alert) {
    return next(new AppError("Alert not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

// Get unread alert count
exports.getUnreadAlertCount = catchAsync(async (req, res, next) => {
  const count = await LocationAlert.countDocuments({
    member_mail: req.member.mail,
    family_id: req.familyAccount._id,
    is_read: false
  });

  res.status(200).json({
    status: "success",
    data: { count }
  });
});

//========================================================================================
// SHARED LOCATIONS (Share map point with family members)
//========================================================================================

// Share a location with family member(s)
exports.shareLocation = catchAsync(async (req, res, next) => {
  const { receiver_mails, location_name, latitude, longitude, address, message, expires_at } = req.body;

  if (!receiver_mails || !Array.isArray(receiver_mails) || receiver_mails.length === 0) {
    return next(new AppError("Please provide receiver_mails array", 400));
  }

  if (!location_name || latitude === undefined || longitude === undefined) {
    return next(new AppError("Please provide location_name, latitude, and longitude", 400));
  }

  // Verify all receivers are in the same family
  const familyMembers = await Member.find({
    family_id: req.familyAccount._id,
    mail: { $in: receiver_mails }
  });

  const validMails = familyMembers.map(m => m.mail);
  if (validMails.length === 0) {
    return next(new AppError("No valid family members found in receiver list", 404));
  }

  const sharedLocations = await SharedLocation.insertMany(
    validMails.map(mail => ({
      sender_mail: req.member.mail,
      receiver_mail: mail,
      family_id: req.familyAccount._id,
      location_name,
      latitude,
      longitude,
      address: address || '',
      message: message || '',
      expires_at: expires_at || null
    }))
  );

  res.status(201).json({
    status: "success",
    message: `Location shared with ${sharedLocations.length} member(s)`,
    data: { sharedLocations }
  });
});

// Get locations shared WITH me (inbox)
exports.getReceivedLocations = catchAsync(async (req, res, next) => {
  const locations = await SharedLocation.find({
    receiver_mail: req.member.mail,
    family_id: req.familyAccount._id
  }).sort({ shared_at: -1 });

  // Enrich with sender info
  const enriched = [];
  for (const loc of locations) {
    const sender = await Member.findOne({ mail: loc.sender_mail });
    enriched.push({
      ...loc.toObject(),
      sender_username: sender ? sender.username : 'Unknown'
    });
  }

  res.status(200).json({
    status: "success",
    results: enriched.length,
    data: { locations: enriched }
  });
});

// Get locations I shared (sent)
exports.getSentLocations = catchAsync(async (req, res, next) => {
  const locations = await SharedLocation.find({
    sender_mail: req.member.mail,
    family_id: req.familyAccount._id
  }).sort({ shared_at: -1 });

  // Enrich with receiver info
  const enriched = [];
  for (const loc of locations) {
    const receiver = await Member.findOne({ mail: loc.receiver_mail });
    enriched.push({
      ...loc.toObject(),
      receiver_username: receiver ? receiver.username : 'Unknown'
    });
  }

  res.status(200).json({
    status: "success",
    results: enriched.length,
    data: { locations: enriched }
  });
});

// Mark shared location as viewed
exports.markSharedLocationViewed = catchAsync(async (req, res, next) => {
  const { sharedLocationId } = req.params;

  const location = await SharedLocation.findOneAndUpdate(
    {
      _id: sharedLocationId,
      receiver_mail: req.member.mail
    },
    { is_viewed: true },
    { new: true }
  );

  if (!location) {
    return next(new AppError("Shared location not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { location }
  });
});

// Delete a shared location
exports.deleteSharedLocation = catchAsync(async (req, res, next) => {
  const { sharedLocationId } = req.params;

  // Allow deletion by sender OR receiver
  const location = await SharedLocation.findOneAndDelete({
    _id: sharedLocationId,
    family_id: req.familyAccount._id,
    $or: [
      { sender_mail: req.member.mail },
      { receiver_mail: req.member.mail }
    ]
  });

  if (!location) {
    return next(new AppError("Shared location not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

// Get family members list (for sharing UI)
exports.getFamilyMembers = catchAsync(async (req, res, next) => {
  const members = await Member.find({
    family_id: req.familyAccount._id
  }).populate('member_type_id').select('username mail member_type_id');

  res.status(200).json({
    status: "success",
    results: members.length,
    data: { members }
  });
});
