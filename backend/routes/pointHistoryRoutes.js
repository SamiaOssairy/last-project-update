const express = require('express');
const { protect, restrictTo } = require('../controllers/AuthController');
const {
  getMyPointHistory,
  getMemberPointHistory,
  getAllPointHistory
} = require('../controllers/PointHistoryController');

const pointHistoryRouter = express.Router();

pointHistoryRouter.use(protect);

// My point history (all members can see their own)
pointHistoryRouter.get('/my-history', getMyPointHistory);

// Parent only - view specific member's history or all history
pointHistoryRouter.get('/all', restrictTo('Parent'), getAllPointHistory);
pointHistoryRouter.get('/:memberMail', restrictTo('Parent'), getMemberPointHistory);

module.exports = pointHistoryRouter;
