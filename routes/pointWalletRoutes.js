const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  getMyWallet,
  getMemberWallet,
  manualAdjustment,
  getPointsRanking
} = require('../controllers/PointWalletController');

const pointWalletRouter = express.Router();

pointWalletRouter.use(protect);

// My wallet
pointWalletRouter.get('/my-wallet', getMyWallet);

// Leaderboard (all can see)
pointWalletRouter.get('/ranking', getPointsRanking);

// Parent only - view specific member's wallet and manual adjustments
pointWalletRouter.get('/:memberMail', getMemberWallet);
pointWalletRouter.post('/adjust', restrictTo('Parent'), manualAdjustment);

module.exports = pointWalletRouter;
