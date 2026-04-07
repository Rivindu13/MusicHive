import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    artistUid: { type: String, required: true, index: true },
    customerUid: { type: String, required: true, index: true },
    date: { type: String, required: true },
    slotType: { type: String, required: true, enum: ["MORNING", "EVENING"] },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "CONFIRMED",
        "CANCELLED",
        "EXPIRED",
      ],
      default: "PENDING",
      index: true,
    },

    note: { type: String, default: "" },
    price: { type: Number, default: null },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
    paidAt: { type: Date, default: null },
    paymentRef: { type: String, default: "" },
    amountPaid: { type: Number, default: null },

    payhereOrderId: { type: String, default: "", index: true },
    paymentMessage: { type: String, default: "" },

    // add this because your routes already use it
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BookingSchema.index({ artistUid: 1, status: 1 });
BookingSchema.index({ customerUid: 1, status: 1 });
BookingSchema.index({ artistUid: 1, customerUid: 1, date: 1, slotType: 1 });

const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
export default Booking;