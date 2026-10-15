import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, maxlength: 1000 },
  image: { type: String, required: true },
  imageTile: { type: Number, default: 0, min: 0, max: 5 },
  badge: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
