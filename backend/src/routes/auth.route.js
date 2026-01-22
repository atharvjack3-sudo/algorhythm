import express from "express";
import {
  signup,
  login,
  refresh,
  logout
} from "../controllers/auth.controller.js";

const router = express.Router();

// create account + issue tokens
router.post("/signup", signup);

// login + issue tokens
router.post("/login", login);

// get new access token using refresh token
router.post("/refresh", refresh);

// revoke refresh token + logout
router.post("/logout", logout);

export default router;
