import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import productsRouter, { seedProducts } from "./routes/products.js";
import authRouter from "./routes/auth.js";
import accountRouter from "./routes/account.js";

const app = express();
const port = process.env.PORT || 4000;

const defaultClientOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];
const clientOrigins = (process.env.CLIENT_ORIGIN || (process.env.NODE_ENV === "production" ? "" : defaultClientOrigins.join(",")))
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && clientOrigins.length === 0) {
  throw new Error("CLIENT_ORIGIN harus diisi dengan URL frontend yang dideploy.");
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(new Error("Origin frontend ini belum diizinkan oleh CLIENT_ORIGIN."));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.json({
    status: databaseConnected ? "ok" : "degraded",
    service: "Ruang Kreasi API",
    database: databaseConnected ? "connected" : "disconnected"
  });
});
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/products", productsRouter);
app.use((error, _req, res, _next) => {
  const status = error.name === "ValidationError" || error.code === 11000 ? 400 : 500;
  res.status(status).json({ message: error.code === 11000 ? "Slug produk sudah digunakan." : error.message || "Terjadi kesalahan pada server." });
});

app.listen(port, "0.0.0.0", () => console.log(`Ruang Kreasi API berjalan pada port ${port}`));

// The API can still show the sample catalog when MongoDB is not running.
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ruang-kreasi", { serverSelectionTimeoutMS: 3000 });
    await seedProducts();
  } catch (error) {
    console.warn("MongoDB tidak tersedia; API memakai data pratinjau:", error.message);
  }
}

connectToDatabase();
