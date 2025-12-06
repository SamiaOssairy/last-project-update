const express = require('express');
const { createMemberType, getAllMemberTypes, addPermissionsToMemberType } = require('../controllers/MemberTypeController');
const { protect, restrictTo } = require('../controllers/AuthController');

const memberTypeRouter = express.Router();

memberTypeRouter.get('/', protect, getAllMemberTypes);
memberTypeRouter.post('/', protect, restrictTo('Parent'), createMemberType);
memberTypeRouter.patch('/:memberTypeId/permissions', protect, restrictTo('Parent'), addPermissionsToMemberType);

module.exports = memberTypeRouter;











