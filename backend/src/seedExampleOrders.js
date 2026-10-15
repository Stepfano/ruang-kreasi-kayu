import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Order from "./models/Order.js";

const email = String(process.argv[2] || "").trim().toLowerCase();

if (!email) {
  console.error("Gunakan: node src/seedExampleOrders.js email-akun");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ruang-kreasi", {
    serverSelectionTimeoutMS: 10000
  });

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Akun tersebut belum terdaftar di MongoDB.");
  }

  const existingExamples = await Order.countDocuments({ userId: user._id, isExample: true });
  if (existingExamples > 0) {
    console.log("Pesanan contoh sudah ada; tidak menambahkan duplikat.");
  } else {
    await Order.insertMany([
      { userId: user._id, productId: "beruang-bara", productName: "Bara si Beruang", quantity: 1, unitPrice: 185000, total: 185000, status: "processing", isExample: true },
      { userId: user._id, productId: "kucing-cika", productName: "Cika si Kucing", quantity: 2, unitPrice: 175000, total: 350000, status: "shipped", isExample: true },
      { userId: user._id, productId: "kodok-kori", productName: "Kori si Kodok", quantity: 1, unitPrice: 165000, total: 165000, status: "received", isExample: true }
    ]);
    console.log("Tiga pesanan contoh berhasil ditambahkan.");
  }
} catch (error) {
  console.error(`Gagal menyiapkan pesanan contoh: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
