const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  updateLocation,
  toggleSharing,
  getMyLocation,
  getFamilyLocations,
  requestPermission,
  respondPermission,
  getMyPermissionRequests,
  getMyOutgoingRequests,
  revokePermission,
  // History
  getLocationHistory,
  deleteLocationHistory,
  // Alerts
  createLocationAlert,
  getMyAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  getUnreadAlertCount,
  // Shared locations
  shareLocation,
  getReceivedLocations,
  getSentLocations,
  markSharedLocationViewed,
  deleteSharedLocation,
  getFamilyMembers
} = require('../controllers/LocationController');

const locationRouter = express.Router();

// All routes require authentication
locationRouter.use(protect);

// ------ Location sharing ------
locationRouter.post('/update', updateLocation);
locationRouter.patch('/toggle', toggleSharing);
locationRouter.get('/me', getMyLocation);
locationRouter.get('/family', getFamilyLocations);
locationRouter.get('/family-members', getFamilyMembers);

// ------ Permissions ------
locationRouter.post('/permissions', requestPermission);
locationRouter.get('/permissions/incoming', getMyPermissionRequests);
locationRouter.get('/permissions/outgoing', getMyOutgoingRequests);
locationRouter.patch('/permissions/:permissionId', respondPermission);
locationRouter.delete('/permissions/:permissionId', revokePermission);

// ------ Location history ------
locationRouter.get('/history', getLocationHistory);
locationRouter.delete('/history', deleteLocationHistory);

// ------ Location alerts ------
locationRouter.post('/alerts', createLocationAlert);
locationRouter.get('/alerts', getMyAlerts);
locationRouter.get('/alerts/unread-count', getUnreadAlertCount);
locationRouter.patch('/alerts/read-all', markAllAlertsRead);
locationRouter.patch('/alerts/:alertId/read', markAlertRead);
locationRouter.delete('/alerts/:alertId', deleteAlert);

// ------ Shared locations ------
locationRouter.post('/shared', shareLocation);
locationRouter.get('/shared/received', getReceivedLocations);
locationRouter.get('/shared/sent', getSentLocations);
locationRouter.patch('/shared/:sharedLocationId/viewed', markSharedLocationViewed);
locationRouter.delete('/shared/:sharedLocationId', deleteSharedLocation);

module.exports = locationRouter;
