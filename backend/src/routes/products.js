import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { starterProducts } from "../data/products.js";
import requireAuth from "../auth/requireAuth.js";
import requireAdmin from "../auth/requireAdmin.js";

const router = Router();
const previewProducts = starterProducts.map((product) => ({ ...product, _id: product.slug }));

router.get("/", async (req, res, next) => {
  try {
    const { category, q, limit } = req.query;
    const filter = {};
    if (category && category !== "Semua") filter.category = category;
    if (q) filter.name = { $regex: String(q), $options: "i" };
    if (mongoose.connection.readyState !== 1) {
      let products = previewProducts.filter((product) => {
        const matchesCategory = !filter.category || product.category === filter.category;
        const matchesName = !q || product.name.toLowerCase().includes(String(q).toLowerCase());
        return matchesCategory && matchesName;
      });
      if (limit) products = products.slice(0, Math.min(Number(limit) || 0, 100));
      return res.json({ data: products, total: products.length });
    }

    let query = Product.find(filter).sort({ createdAt: -1 });
    if (limit) query = query.limit(Math.min(Number(limit) || 0, 100));
    res.json({ data: await query, total: await Product.countDocuments(filter) });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const previewProduct = previewProducts.find((item) => item.slug === req.params.id || item._id === req.params.id);
      if (!previewProduct) return res.status(404).json({ message: "Produk tidak ditemukan." });
      return res.json({ data: previewProduct });
    }

    let product = null;
    try {
      product = await Product.findById(req.params.id);
    } catch {
      // The value may be a product slug instead of a MongoDB ID.
    }
    if (!product) product = await Product.findOne({ slug: req.params.id });
    if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json({ data: product });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ data: product });
  } catch (error) { next(error); }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json({ data: product });
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json({ message: "Produk berhasil dihapus." });
  } catch (error) { next(error); }
});

export async function seedProducts() {
  // Add starter products that are missing, without changing existing records.
  for (const product of starterProducts) {
    const existingProduct = await Product.findOne({ slug: product.slug });
    if (!existingProduct) await Product.create(product);
  }
}

export default router;
