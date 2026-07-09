import bcrypt from "bcrypt";
import crypto from 'node:crypto';
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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:6px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#111827; padding:32px 40px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.5px;">
                    Algorhythm
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px; color:#111827; font-size:20px; font-weight:600;">
                    Welcome to Algorhythm
                  </h2>
                  <p style="margin:0 0 24px; color:#4b5563; font-size:15px; line-height:1.6;">
                    Thanks for signing up! Please confirm your email address to activate your account and get started.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                    <tr>
                      <td style="border-radius:8px; background-color:#f97316;">
                        <a href="${verificationLink}" target="_blank" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:4px;">
                          Verify Email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px; color:#9ca3af; font-size:13px; line-height:1.5;">
                    This link will expire in 24 hours for security reasons.
                  </p>
                  <p style="margin:0; color:#9ca3af; font-size:13px; line-height:1.5;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationLink}" style="color:#f97316; word-break:break-all;">${verificationLink}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 40px; background-color:#f9fafb; text-align:center; border-top:1px solid #f0f0f0;">
                  <p style="margin:0; color:#9ca3af; font-size:12px;">
                    If you didn't create an Algorhythm account, you can safely ignore this email.
                  </p>
                  <p style="margin:8px 0 0; color:#9ca3af; font-size:12px;">
                    © ${new Date().getFullYear()} Algorhythm. By Atharv Dubey.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
