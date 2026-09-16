import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    name: { type: String, required: true },
    photoURL: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

const chordSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["ARTIST", "CUSTOMER"],
      required: true,
      index: true,
    },

    title: { type: String, default: "", trim: true },
    genre: { type: String, default: "", trim: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, default: 0, min: 0 },

    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

chordSchema.index({ uid: 1, role: 1, createdAt: -1 });
chordSchema.index({ title: 1, genre: 1 });

const Chord = mongoose.models.Chord || mongoose.model("Chord", chordSchema);

export default Chord;