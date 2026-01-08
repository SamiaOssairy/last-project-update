const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');

const familyAccountRouter = express.Router();

familyAccountRouter.post('/deactivate', protect, restrictTo('Parent'), require('../controllers/FamilyAccountController').deactivateFamilyAccount);

module.exports = familyAccountRouter;











