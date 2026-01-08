const express = require('express');
const { createMember, getAllMembers, deleteMember } = require('../controllers/MemberController');
const { protect, restrictTo } = require('../controllers/AuthController');

const memberRouter = express.Router();

memberRouter.get('/', protect, getAllMembers);
memberRouter.post('/', protect, restrictTo('Parent'), createMember);
memberRouter.delete('/:memberId', protect, restrictTo('Parent'), deleteMember);

module.exports = memberRouter;











