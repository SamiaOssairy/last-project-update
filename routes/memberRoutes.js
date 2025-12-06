const express = require('express');
const { createMember, getAllMembers } = require('../controllers/MemberController');
const { protect, restrictTo } = require('../controllers/AuthController');

const memberRouter = express.Router();

memberRouter.get('/', protect, getAllMembers);
memberRouter.post('/', protect, restrictTo('Parent'), createMember);

module.exports = memberRouter;











