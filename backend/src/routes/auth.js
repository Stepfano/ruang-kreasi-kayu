import { Router } from "express";
import mongoose from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import User from "../models/User.js";
import { createToken, hashPassword, verifyPassword } from "../auth/security.js";
import requireAuth from "../auth/requireAuth.js";

const router = Router();
// When MongoDB is off, this small in-memory list keeps local demonstrations usable.
// Use MongoDB in deployment so registered accounts survive server restarts.
const previewUsers = [];

function safeUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role || "customer" };
}

async function findByEmail(email) {
  if (mongoose.connection.readyState === 1) return User.findOne({ email });
  return previewUsers.find((user) => user.email === email) || null;
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: "Nama harus terdiri dari 2–80 karakter." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Masukkan alamat email yang valid." });
    if (password.length < 8) return res.status(400).json({ message: "Kata sandi minimal 8 karakter." });
    if (await findByEmail(email)) return res.status(409).json({ message: "Email sudah terdaftar. Silakan masuk." });

    const userData = { name, email, passwordHash: await hashPassword(password) };
    const user = mongoose.connection.readyState === 1
      ? await User.create(userData)
      : { ...userData, _id: `preview-${Date.now()}` };
    if (mongoose.connection.readyState !== 1) previewUsers.push(user);
    return res.status(201).json({ token: createToken(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await findByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email atau kata sandi tidak cocok." });
    }
    return res.json({ token: createToken(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Masukkan alamat email yang valid." });
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return res.status(503).json({ message: "Pengiriman email belum diaktifkan. Hubungi pengelola website." });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Layanan akun sedang tidak tersedia. Coba lagi nanti." });
    }

    const user = await User.findOne({ email });
    // Always return the same response for known and unknown addresses.
    if (user) {
      const resetToken = randomBytes(32).toString("hex");
      user.passwordResetTokenHash = createHash("sha256").update(resetToken).digest("hex");
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const clientUrl = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [user.email],
            subject: "Atur ulang kata sandi Ruang Kreasi Kayu",
            text: `Halo ${user.name},\n\nGunakan tautan ini untuk membuat kata sandi baru (berlaku 30 menit):\n${resetUrl}\n\nJika kamu tidak meminta perubahan ini, abaikan email ini.`
          })
        });
        if (!emailResponse.ok) console.warn("Email pemulihan gagal dikirim melalui penyedia email.");
      } catch {
        console.warn("Email pemulihan tidak dapat terhubung ke penyedia email.");
      }
    }
    return res.json({ message: "Jika email terdaftar, tautan untuk mengatur ulang kata sandi akan segera dikirim." });
  } catch (error) { next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || password.length < 8) {
      return res.status(400).json({ message: "Tautan tidak valid atau kata sandi kurang dari 8 karakter." });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Layanan akun sedang tidak tersedia. Coba lagi nanti." });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Tautan sudah tidak berlaku. Minta tautan baru." });

    user.passwordHash = await hashPassword(password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.json({ message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru." });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role } });
});

export default router;
