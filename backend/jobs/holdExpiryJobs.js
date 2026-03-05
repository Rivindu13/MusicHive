// jobs/holdExpiryJob.js
import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";

async function runCleanup() {
  const now = new Date();

  /**
   * 1) Release expired HELD slots -> OPEN
   * (No booking exists at this stage in the new flow)
   */
  await AvailabilitySlot.updateMany(
    { status: "HELD", heldUntil: { $lt: now } },
    { $set: { status: "OPEN", heldUntil: null, heldBy: null } }
  );

  /**
   * 2) Expire PENDING bookings older than 24h (expiresAt)
   * and release RESERVED slots linked to them
   */
  const expiredBookings = await Booking.find({
    status: "PENDING",
    expiresAt: { $lt: now },
  }).select("_id").lean();

  if (expiredBookings.length > 0) {
    const bookingIds = expiredBookings.map((b) => b._id);

    // mark bookings expired
    await Booking.updateMany(
      { _id: { $in: bookingIds }, status: "PENDING" },
      { $set: { status: "EXPIRED" } }
    );

    // release reserved slots
    await AvailabilitySlot.updateMany(
      { status: "RESERVED", bookingId: { $in: bookingIds } },
      { $set: { status: "OPEN", bookingId: null, heldUntil: null, heldBy: null } }
    );
  }
}

export function startHoldExpiryJob() {
  // every 60s (MVP)
  setInterval(() => {
    runCleanup().catch((e) => console.error("ExpiryJob error:", e.message));
  }, 60 * 1000);
}