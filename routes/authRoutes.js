const express = require("express");


const { signUp, login, forgotPassword, resetPassword, protect, restrictTo } = require("../controllers/AuthController");

const authRouter = express.Router();
authRouter.post("/signup", signUp);
authRouter.post("/login", login);

// Protected routes - only for logged-in users with Parent role
authRouter.use(protect);
authRouter.use(restrictTo("Parent"));

authRouter.post("/forgotPassword", forgotPassword);
authRouter.patch("/resetPassword/:token", resetPassword);

module.exports = authRouter;








