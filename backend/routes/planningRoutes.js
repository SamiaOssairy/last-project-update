const express = require('express');
const { protect } = require('../controllers/AuthController');
const { sendMessage, getChatHistory, clearHistory } = require('../controllers/PlanningAIController');

const planningRouter = express.Router();

planningRouter.use(protect);

planningRouter.post('/chat', sendMessage);
planningRouter.get('/history', getChatHistory);
planningRouter.delete('/history', clearHistory);

module.exports = planningRouter;
