import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import requireAuth from "../auth/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/wishlist", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database belum terhubung." });
    }
    const user = await User.findById(req.user.sub).select("wishlist");
    if (!user) return res.status(404).json({ message: "Akun tidak ditemukan." });
    return res.json({ data: user.wishlist || [] });
  } catch (error) { next(error); }
});

router.put("/wishlist", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database belum terhubung." });
    }
    const productIds = Array.isArray(req.body.productIds)
      ? [...new Set(req.body.productIds.map((id) => String(id).trim()).filter(Boolean))]
      : null;
    if (!productIds || productIds.length > 100) {
      return res.status(400).json({ message: "Daftar wishlist tidak valid." });
    }
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { wishlist: productIds },
      { new: true, runValidators: true }
    ).select("wishlist");
    if (!user) return res.status(404).json({ message: "Akun tidak ditemukan." });
    return res.json({ data: user.wishlist });
  } catch (error) { next(error); }
});

router.get("/orders", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database belum terhubung." });
    }
    const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    return res.json({ data: orders });
  } catch (error) { next(error); }
});

router.post("/orders", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Database belum terhubung." });
    }
    const productName = String(req.body.productName || "").trim();
    const productId = String(req.body.productId || "").trim();
    const quantity = Number(req.body.quantity);
    const unitPrice = Number(req.body.unitPrice);
    if (!productName || productName.length > 120 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(400).json({ message: "Detail pesanan tidak valid." });
    }
    const order = await Order.create({
      userId: req.user.sub,
      productId,
      productName,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      status: "processing"
    });
    return res.status(201).json({ data: order });
  } catch (error) { next(error); }
});

export default router;
