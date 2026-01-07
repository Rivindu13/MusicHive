import mongoose from "mongoose";

const chordSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    title: { type: String, default: "" },
    genre: { type: String, default: "Uncategorized" },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Chord", chordSchema);
