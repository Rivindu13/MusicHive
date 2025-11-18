import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String },
  role: { type: String, required: true },
  photoURL: { type: String, default: null },   // <-- ADD THIS
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
