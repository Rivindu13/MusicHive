// jobs/holdExpiryJob.js
import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import Subscription from "../models/Subscription.js";

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

  // Preserve successful-event performance before removing past event bookings.
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const pastDateBookings = await Booking.find({ status: { $nin: ["EXPIRED"] } })
    .select("_id customerUid artistUid date status slotType")
    .lean();
  const bookingsToDelete = pastDateBookings.filter((booking) => {
    const [year, month, day] = String(booking.date || "").split("-").map(Number);
    const bookingDate = new Date(year, month - 1, day);
    return Number.isFinite(bookingDate.getTime()) && bookingDate < localToday;
  });

  for (const booking of bookingsToDelete) {
    if (booking.status === "CONFIRMED") {
      await User.updateOne(
        { uid: booking.customerUid },
        { $inc: { completedEventsCount: 1 } }
      );
    }

    await AvailabilitySlot.updateOne(
      {
        artistUid: booking.artistUid,
        date: booking.date,
        slotType: booking.slotType,
        bookingId: booking._id,
      },
      { $set: { status: "OPEN", bookingId: null, heldUntil: null, heldBy: null } }
    );
    await Booking.deleteOne({ _id: booking._id });
  }

  await Subscription.updateMany(
    { status: "ACTIVE", expiresAt: { $lt: now } },
    { $set: { status: "EXPIRED" } }
  );
}

export function startHoldExpiryJob() {
  // every 60s (MVP)
  setInterval(() => {
    runCleanup().catch((e) => console.error("ExpiryJob error:", e.message));
  }, 60 * 1000);
}