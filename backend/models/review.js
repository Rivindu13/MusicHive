import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // ✅ required booking link (review only allowed after paid booking)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    // ✅ reviewer (who writes the review)
    reviewerUid: { type: String, required: true, index: true },
    reviewerRole: { type: String, enum: ["CUSTOMER", "ARTIST"], required: true },

    // ✅ reviewee (who receives the review)
    revieweeUid: { type: String, required: true, index: true },
    revieweeRole: { type: String, enum: ["CUSTOMER", "ARTIST"], required: true },

    // ✅ snapshot details (avoid extra lookup)
    reviewerName: { type: String, required: true },
    reviewerPhotoURL: { type: String, default: null },

    // optional: event type
    eventType: { type: String, default: "Event" },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate reviews by same reviewer for same booking
reviewSchema.index({ bookingId: 1, reviewerUid: 1 }, { unique: true });

// ✅ Useful for profile pages
reviewSchema.index({ revieweeUid: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);