import express from "express";
import axios from "axios";
import { db } from "../config/db";
import fs from "fs/promises";
import path from "path";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.put("/async/judge-callback/:token", async (req, res) => {
    const { token } = req.params;
    if (token != process.env.JUDGE0_CALLBACK_TOKEN) return res.status(403).json({ message: "Forbidden" });
});

router.post("/async/submit", authMiddleware, async (req, res) => {

});