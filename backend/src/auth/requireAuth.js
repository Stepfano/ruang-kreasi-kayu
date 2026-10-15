import { readToken } from "./security.js";

export default function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  const user = scheme === "Bearer" ? readToken(token) : null;
  if (!user) return res.status(401).json({ message: "Silakan masuk untuk melanjutkan." });
  req.user = user;
  next();
}
