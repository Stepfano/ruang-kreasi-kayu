import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productId: { type: String, default: "" },
  productName: { type: String, required: true, trim: true, maxlength: 120 },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["processing", "shipped", "received"], default: "processing" },
  isExample: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
