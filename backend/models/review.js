import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    artistUid: { type: String, required: true, index: true }, // artist user uid
    plannerUid: { type: String, required: true },             // event planner uid

    // Optional: store snapshot details to avoid extra lookups
    plannerName: { type: String, required: true },
    plannerPhotoURL: { type: String, default: null },

    // Optional: what event was it for
    eventType: { type: String, default: "Event" }, // e.g., "Wedding reception"

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },

    // Optional: link to booking id if you have bookings
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { timestamps: true } // createdAt, updatedAt
);

export default mongoose.model("Review", reviewSchema);
