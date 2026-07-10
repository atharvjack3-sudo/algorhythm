import express from "express";
import {
  signup,
  login,
  refresh,
  logout,
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";

const router = express.Router();


router.post("/signup", registerUser);
router.post("/verify-user", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
