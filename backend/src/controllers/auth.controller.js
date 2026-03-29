import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  const { rows } = await db.query(
    `SELECT id, password_hash
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
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