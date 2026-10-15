import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  wishlist: { type: [String], default: [] },
  role: { type: String, enum: ["customer", "admin"], default: "customer" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
