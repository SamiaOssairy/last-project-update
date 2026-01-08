const express = require("express");


const { signUp, login, forgotPassword, resetPassword, protect, restrictTo, setPassword } = require("../controllers/AuthController");

const authRouter = express.Router();
authRouter.post("/signup", signUp);
authRouter.post("/login", login);

// Protected routes - for all logged-in users
authRouter.use(protect);

// Set/Change password - available to all members
authRouter.post("/setPassword", setPassword);

// Parent only routes
authRouter.use(restrictTo("Parent"));

authRouter.post("/forgotPassword", forgotPassword);
authRouter.patch("/resetPassword/:token", resetPassword);

module.exports = authRouter;








