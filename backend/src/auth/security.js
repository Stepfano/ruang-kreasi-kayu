import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const tokenLifetimeSeconds = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production.");
  return "development-only-secret-change-before-deploy";
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, savedHash) {
  const [salt, savedKey] = String(savedHash).split(":");
  if (!salt || !savedKey) return false;
  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(savedKey, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: String(user._id), name: user.name, email: user.email, role: user.role || "customer", iat: now, exp: now + tokenLifetimeSeconds })).toString("base64url");
  const content = `${header}.${payload}`;
  return `${content}.${sign(content)}`;
}

export function readToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const content = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(content));
  const received = Buffer.from(parts[2]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
