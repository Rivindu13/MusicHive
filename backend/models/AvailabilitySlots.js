import mongoose from "mongoose";

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    artistUid: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    slotType: { type: String, required: true, enum: ["MORNING", "EVENING"] },

    startTime: { type: String },
    endTime: { type: String },

    status: {
      type: String,
      enum: ["OPEN", "HELD", "RESERVED", "BOOKED", "DISABLED"],
      default: "OPEN",
      index: true,
    },

    // ✅ who is holding this slot
    heldBy: { type: String, default: null, index: true },

    // ✅ until when it's held (10 mins)
    heldUntil: { type: Date, default: null },

    // ✅ set only when RESERVED/BOOKED
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true }
);

AvailabilitySlotSchema.index({ artistUid: 1, date: 1, slotType: 1 }, { unique: true });
AvailabilitySlotSchema.index({ date: 1, slotType: 1, status: 1 });

const AvailabilitySlot = mongoose.model("AvailabilitySlot", AvailabilitySlotSchema);

export default AvailabilitySlot;