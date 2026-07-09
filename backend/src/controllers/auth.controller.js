import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { Resend } from 'resend';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const resend = new Resend(process.env.RESEND_API_KEY);
/* =========================
   SIGNUP 
========================= */
export async function signup(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    // users (Postgres requires RETURNING to get the insert ID)
    const { rows: userRows } = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      [username, email, hash]
    );

    const userId = userRows[0].id;

    // user_stats
    await db.query(
      `INSERT INTO user_stats (
        user_id,
        total_submissions,
        total_solved,
        easy_solved,
        medium_solved,
        hard_solved,
        acceptance_rate,
        global_rank
      ) VALUES ($1, 0, 0, 0, 0, 0, NULL, NULL)`,
      [userId]
    );

    const accessToken = signAccessToken({ id: userId });
    const refreshToken = signRefreshToken({ id: userId });

    // optional persistence (Postgres interval syntax)
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, refreshToken]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/api/auth/refresh",
      maxAge: SEVEN_DAYS_MS,
    });

    return res.status(201).json({ accessToken });

  } catch (err) {
    // 23505 is the Postgres error code for unique_violation
    if (err.code === "23505") {
      return res.status(409).json({ error: "User already exists" });
    }
    throw err;
  }
}

/* =========================
   LOGIN 
========================= */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 1. Fetch the user, explicitly asking for the is_verified flag
  const { rows } = await db.query(
    `SELECT id, password_hash, is_verified
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.is_verified) {
    return res.status(403).json({ error: "Please verify your email address to log in." });
  }

  const accessToken = signAccessToken({ id: user.id });
  const refreshToken = signRefreshToken({ id: user.id });

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshToken]
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/api/auth/refresh",
    maxAge: SEVEN_DAYS_MS,
  });

  return res.json({ accessToken });
}

/* =========================
   REFRESH 
========================= */
export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.sendStatus(403);
  }

  const accessToken = signAccessToken({ id: payload.id });
  return res.json({ accessToken });
}

/* =========================
   LOGOUT  
========================= */
export async function logout(req, res) {
  const token = req.cookies.refreshToken;

  if (token) {
    await db.query(
      `DELETE FROM refresh_tokens WHERE token = $1`,
      [token]
    );
  }

  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });

  return res.sendStatus(204);
}

export async function registerUser(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const { rows: existingRows } = await db.query(
      `SELECT id, is_verified FROM users WHERE email = $1`,
      [email]
    );

    const existingUser = existingRows[0];
    let userId;
    const hash = await bcrypt.hash(password, 10);

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(409).json({ error: "User already exists" });
      }
      await db.query(
        `UPDATE users SET password_hash = $1, username = $2 WHERE id = $3`,
        [hash, username, existingUser.id]
      );
      userId = existingUser.id;

      await db.query(
        `DELETE FROM user_tokens WHERE user_id = $1 AND type = 'EMAIL_VERIFY'`, 
        [userId]
      );
    } else {
      
      const { rows: userRows } = await db.query(
        `INSERT INTO users (username, email, password_hash, is_verified)
         VALUES ($1, $2, $3, FALSE) RETURNING id`,
        [username, email, hash]
      );
      userId = userRows[0].id;
    }

    
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO user_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'EMAIL_VERIFY', NOW() + INTERVAL '24 hours')`,
      [userId, verifyToken]
    );

    const verificationLink = `https://algorhythm-xi.vercel.app/verify/${verifyToken}`;
    
    await resend.emails.send({
      from: 'Algorhythm <noreply@mail.atharvdev.me>',
      to: email,
      subject: 'Verify your Algorhythm Account',
      html: `
        <h2>Welcome to Algorhythm</h2>
        <p>Click the link below to activate your account.</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    return res.status(201).json({ message: "Registration successful. Please check your email to verify." });

  } catch (err) {
    if (err.code === "23505") { 
      return res.status(409).json({ error: "Username is already taken" });
    }
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const { rows: tokenRows } = await db.query(
      `SELECT user_id FROM user_tokens 
       WHERE token = $1 AND type = 'EMAIL_VERIFY' AND expires_at > NOW()`,
      [token]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    const userId = tokenRows[0].user_id;

    await db.query(
      `UPDATE users SET is_verified = TRUE WHERE id = $1`,
      [userId]
    );

    
    await db.query(
      `DELETE FROM user_tokens WHERE user_id = $1 AND type = 'EMAIL_VERIFY'`,
      [userId]
    );

    
    await db.query(
      `INSERT INTO user_stats (
        user_id, total_submissions, total_solved,
        easy_solved, medium_solved, hard_solved,
        acceptance_rate, global_rank
      ) VALUES ($1, 0, 0, 0, 0, 0, NULL, NULL)
      ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    
    const accessToken = signAccessToken({ id: userId });
    const refreshToken = signRefreshToken({ id: userId });

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, refreshToken]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/api/auth/refresh",
      maxAge: SEVEN_DAYS_MS,
    });

    return res.status(200).json({ 
      success: true,
      message: "Email verified successfully",
      accessToken 
    });

  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}