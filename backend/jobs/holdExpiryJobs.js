// jobs/holdExpiryJob.js
import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";

async function runHoldExpiryCleanup() {
  const now = new Date();

  // Find expired held slots
  const expiredSlots = await AvailabilitySlot.find({
    status: "HELD",
    heldUntil: { $lt: now },
  }).lean();

  if (expiredSlots.length === 0) return;

  const bookingIds = expiredSlots.map((s) => s.bookingId).filter(Boolean);

  // Reset slots
  await AvailabilitySlot.updateMany(
    { status: "HELD", heldUntil: { $lt: now } },
    { $set: { status: "OPEN", heldUntil: null, bookingId: null } }
  );

  // mark pending bookings as expired
  if (bookingIds.length > 0) {
    await Booking.updateMany(
      { _id: { $in: bookingIds }, status: "PENDING" },
      { $set: { status: "EXPIRED" } }
    );
  }
}

export function startHoldExpiryJob() {
  // every 60s (MVP)
  setInterval(() => {
    runHoldExpiryCleanup().catch((e) =>
      console.error("HoldExpiryJob error:", e.message)
    );
  }, 60 * 1000);
}