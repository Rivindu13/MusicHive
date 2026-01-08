// models/Chord.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },          // reviewer uid
    name: { type: String, required: true },         // reviewer name
    photoURL: { type: String, default: "" },        // reviewer photo
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

const chordSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },          // chord owner (artist)
    title: { type: String, default: "" },
    genre: { type: String, default: "" },
    imageUrl: { type: String, required: true },

    reviews: { type: [reviewSchema], default: [] }, // ✅ new
  },
  { timestamps: true }
);

// optional: virtual average rating
chordSchema.virtual("avgRating").get(function () {
  if (!this.reviews?.length) return 0;
  const sum = this.reviews.reduce((a, r) => a + (r.rating || 0), 0);
  return Math.round((sum / this.reviews.length) * 10) / 10; // 1 decimal
});

export default mongoose.model("Chord", chordSchema);
