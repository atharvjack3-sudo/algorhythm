import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const token = auth.split(" ")[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.sendStatus(401);
  }
}
