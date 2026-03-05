import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    artistUid: { type: String, required: true, index: true },
    customerUid: { type: String, required: true, index: true },
    date: { type: String, required: true },
    slotType: { type: String, required: true, enum: ["MORNING", "EVENING"] },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },

    note: { type: String, default: "" },
    price: { type: Number, default: null },

    // ✅ NEW: payment tracking
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
    paidAt: { type: Date, default: null },
    paymentRef: { type: String, default: "" }, // optional: gateway ref / txn id
    amountPaid: { type: Number, default: null },
  },
  { timestamps: true }
);

BookingSchema.index({ artistUid: 1, status: 1 });
BookingSchema.index({ customerUid: 1, status: 1 });

// ✅ helpful for review lookup / enforcing uniqueness logic
BookingSchema.index({ artistUid: 1, customerUid: 1, date: 1, slotType: 1 });

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;