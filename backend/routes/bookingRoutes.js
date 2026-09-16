import express from "express";
import crypto from "crypto";
const router = express.Router();

import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Review from "../models/review.js";

import { BOOKING_PENDING_HOURS } from "../config/bookingConstants.js";
import { tomorrowYMD } from "../utils/date.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { createNotification } from "../controllers/notificationController.js";

function isValidYMD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function mapCustomer(user) {
  if (!user) return null;

  return {
    uid: user.uid,
    name: user.name || "",
    email: user.email || "",
    photoURL: user.photoURL || null,
    role: user.role || "",
    organizerProfile: {
      phone: user.organizerProfile?.phone || "",
      organizationName: user.organizerProfile?.organizationName || "",
      eventType: user.organizerProfile?.eventType || "",
      location: user.organizerProfile?.location || "",
      bio: user.organizerProfile?.bio || "",
      preferredGenres: Array.isArray(user.organizerProfile?.preferredGenres)
        ? user.organizerProfile.preferredGenres
        : [],
      budgetRange: user.organizerProfile?.budgetRange || "",
      instagram: user.organizerProfile?.instagram || "",
      website: user.organizerProfile?.website || "",
      isProfileComplete: !!user.organizerProfile?.isProfileComplete,
    },
  };
}

function mapArtist(user) {
  if (!user) return null;

  return {
    uid: user.uid,
    name: user.name || "",
    email: user.email || "",
    photoURL: user.photoURL || null,
    role: user.role || "",
    artistProfile: {
      bio: user.artistProfile?.bio || "",
      genres: Array.isArray(user.artistProfile?.genres)
        ? user.artistProfile.genres
        : [],
      location: user.artistProfile?.location || "",
      pricePerHour: user.artistProfile?.pricePerHour ?? null,
      instruments: Array.isArray(user.artistProfile?.instruments)
        ? user.artistProfile.instruments
        : [],
      socials: {
        instagram: user.artistProfile?.socials?.instagram || "",
        youtube: user.artistProfile?.socials?.youtube || "",
        spotify: user.artistProfile?.socials?.spotify || "",
      },
      bandMembers: Array.isArray(user.artistProfile?.bandMembers)
        ? user.artistProfile.bandMembers
        : [],
      isProfileComplete: !!user.artistProfile?.isProfileComplete,
    },
  };
}

function isPastBookingDate(ymd) {
  if (!ymd) return false;
  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [year, month, day] = ymd.split("-").map(Number);
  const bookingDay = new Date(year, month - 1, day);

  return bookingDay < localToday;
}

async function expireOldPendingBookingsForArtist(artistUid) {
  const pendingBookings = await Booking.find({
    artistUid,
    status: "PENDING",
  });

  for (const booking of pendingBookings) {
    const shouldExpire =
      isPastBookingDate(booking.date) ||
      (booking.expiresAt && booking.expiresAt < new Date());

    if (!shouldExpire) continue;

    booking.status = "EXPIRED";
    await booking.save();

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
    });

    if (slot && slot.status !== "BOOKED") {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.heldBy = null;
      slot.bookingId = null;
      await slot.save();
    }
  }
}

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2);
}

function generatePayHereHash({
  merchantId,
  orderId,
  amount,
  currency,
  merchantSecret,
}) {
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`)
    .digest("hex")
    .toUpperCase();
}

function generatePayHereMd5Sig({
  merchantId,
  orderId,
  payhereAmount,
  payhereCurrency,
  statusCode,
  merchantSecret,
}) {
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(
      `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`
    )
    .digest("hex")
    .toUpperCase();
}

/**
 * POST /api/bookings/request
 */
router.post("/request", requireAuth, async (req, res) => {
  try {
    const customerUid = req.user.uid;
    const { slotId, note, eventLocation, eventType } = req.body || {};

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: "slotId is required",
      });
    }

    if (
      (note !== undefined && typeof note !== "string") ||
      (eventLocation !== undefined && typeof eventLocation !== "string") ||
      (eventType !== undefined && typeof eventType !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking details must be strings",
      });
    }

    const normalizedEventLocation = String(eventLocation || "").trim();
    const normalizedEventType = String(eventType || "").trim();
    if (!normalizedEventLocation || !normalizedEventType) {
      return res.status(400).json({
        success: false,
        message: "Event location and event type are required",
      });
    }

    if (
      normalizedEventLocation.length > 300 ||
      normalizedEventType.length > 120 ||
      String(note || "").trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking details exceed the allowed length",
      });
    }

    const now = new Date();

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    const minDate = tomorrowYMD();
    if (!isValidYMD(slot.date) || slot.date < minDate) {
      return res.status(400).json({
        success: false,
        message: `Booking allowed from ${minDate}`,
      });
    }

    if (slot.status !== "HELD") {
      return res.status(409).json({
        success: false,
        message: "Slot is not held",
      });
    }

    if (!slot.heldBy || slot.heldBy !== customerUid) {
      return res.status(403).json({
        success: false,
        message: "This slot is not held by you",
      });
    }

    if (!slot.heldUntil || slot.heldUntil < now) {
      await AvailabilitySlot.updateOne(
        { _id: slotId, status: "HELD", heldUntil: { $lt: now } },
        { $set: { status: "OPEN", heldBy: null, heldUntil: null } }
      );

      return res.status(409).json({
        success: false,
        message: "Hold expired. Please select again.",
      });
    }

    const existingActiveBooking = await Booking.findOne({
      artistUid: slot.artistUid,
      date: slot.date,
      slotType: slot.slotType,
      status: { $in: ["PENDING", "ACCEPTED", "CONFIRMED"] },
    });

    if (existingActiveBooking) {
      return res.status(409).json({
        success: false,
        message: "This slot already has an active booking",
      });
    }

    const reservedSlot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slotId,
        status: "HELD",
        heldBy: customerUid,
        heldUntil: { $gt: now },
      },
      {
        $set: {
          status: "RESERVED",
          heldUntil: null,
          heldBy: null,
        },
      },
      { new: true }
    );

    if (!reservedSlot) {
      return res.status(409).json({
        success: false,
        message: "Slot could not be reserved",
      });
    }

    const artistUser = await User.findOne({
      uid: reservedSlot.artistUid,
    }).lean();

    if (!artistUser) {
      reservedSlot.status = "OPEN";
      reservedSlot.bookingId = null;
      await reservedSlot.save();

      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const artistPrice = artistUser.artistProfile?.pricePerHour;

    if (typeof artistPrice !== "number" || artistPrice <= 0) {
      reservedSlot.status = "OPEN";
      reservedSlot.bookingId = null;
      await reservedSlot.save();

      return res.status(400).json({
        success: false,
        message: "Artist price is not set",
      });
    }

    const expiresAt = new Date(
      now.getTime() + BOOKING_PENDING_HOURS * 60 * 60 * 1000
    );

    const booking = await Booking.create({
      artistUid: reservedSlot.artistUid,
      customerUid,
      date: reservedSlot.date,
      slotType: reservedSlot.slotType,
      status: "PENDING",
      note: String(note || "").trim(),
      eventLocation: normalizedEventLocation,
      eventType: normalizedEventType,
      price: artistPrice,
      expiresAt,
    });

    reservedSlot.bookingId = booking._id;
    await reservedSlot.save();

    // 🔔 Notification for artist
    await createNotification({
      recipientUid: booking.artistUid,
      senderUid: booking.customerUid,
      type: "NEW_BOOKING",
      title: "New Booking Request",
      message: "You have received a new booking request.",
      link: "/artist/bookings",
    });

    return res.status(201).json({
      success: true,
      data: { booking, slot: reservedSlot },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * PATCH /api/bookings/:id/accept
 */
router.patch("/:id/accept", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.artistUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Booking must be PENDING",
      });
    }

    if (booking.expiresAt && booking.expiresAt < new Date()) {
      booking.status = "EXPIRED";
      await booking.save();

      return res.status(409).json({
        success: false,
        message: "Booking request expired",
      });
    }

    if (isPastBookingDate(booking.date)) {
      booking.status = "EXPIRED";
      await booking.save();

      return res.status(409).json({
        success: false,
        message: "Booking request date has passed",
      });
    }

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
      status: "RESERVED",
    });

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: "Slot link mismatch",
      });
    }

    booking.status = "ACCEPTED";
    await booking.save();

    slot.status = "BOOKED";
    slot.heldUntil = null;
    slot.heldBy = null;
    await slot.save();

    // 🔔 Notification for customer / event planner
    await createNotification({
      recipientUid: booking.customerUid,
      senderUid: booking.artistUid,
      type: "BOOKING_ACCEPTED",
      title: "Booking Accepted",
      message: "Your booking request has been accepted by the artist.",
      link: "/customer/my-bookings",
    });

    return res.json({
      success: true,
      data: { booking, slot },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * PATCH /api/bookings/:id/reject
 */
router.patch("/:id/reject", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.artistUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Booking must be PENDING",
      });
    }

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
    });

    booking.status = "REJECTED";
    await booking.save();

    if (slot) {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.heldBy = null;
      slot.bookingId = null;
      await slot.save();
    }

    return res.json({
      success: true,
      data: { booking },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/bookings/artist/:uid?status=PENDING
 */
router.get("/artist/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

    if (uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    await expireOldPendingBookingsForArtist(uid);

    const query = { artistUid: uid };
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    const customerUids = [
      ...new Set(bookings.map((b) => b.customerUid).filter(Boolean)),
    ];

    const customers = await User.find({ uid: { $in: customerUids } })
      .select(
        "uid name email role photoURL organizerProfile.phone organizerProfile.organizationName organizerProfile.eventType organizerProfile.location organizerProfile.bio organizerProfile.preferredGenres organizerProfile.budgetRange organizerProfile.instagram organizerProfile.website organizerProfile.isProfileComplete"
      )
      .lean();

    const customerMap = new Map(customers.map((u) => [u.uid, mapCustomer(u)]));

    let artistReviewBookingIds = [];

    if (
      ["ACCEPTED", "CONFIRMED", "COMPLETED"].includes(
        String(status).toUpperCase()
      ) ||
      !status
    ) {
      const reviews = await Review.find({
        reviewerUid: uid,
        reviewerRole: "ARTIST",
      })
        .select("bookingId")
        .lean();

      artistReviewBookingIds = reviews.map((r) => String(r.bookingId));
    }

    const enriched = bookings.map((booking) => {
      const isPast = isPastBookingDate(booking.date);
      const artistReviewGiven = artistReviewBookingIds.includes(
        String(booking._id)
      );

      return {
        ...booking,
        customer: customerMap.get(booking.customerUid) || null,
        isPastEvent: isPast,
        artistReviewGiven,
        canReviewOrganizer:
          (booking.status === "ACCEPTED" || booking.status === "CONFIRMED") &&
          isPast &&
          !artistReviewGiven,
      };
    });

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/bookings/customer/:uid
 */
router.get("/customer/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

    if (uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const query = { customerUid: uid };
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    const artistUids = [
      ...new Set(bookings.map((b) => b.artistUid).filter(Boolean)),
    ];

    const artists = await User.find({ uid: { $in: artistUids } })
      .select(
        "uid name email role photoURL artistProfile.bio artistProfile.genres artistProfile.location artistProfile.pricePerHour artistProfile.instruments artistProfile.socials artistProfile.bandMembers artistProfile.isProfileComplete"
      )
      .lean();

    const artistMap = new Map(artists.map((u) => [u.uid, mapArtist(u)]));

    const enriched = bookings.map((booking) => ({
      ...booking,
      artist: artistMap.get(booking.artistUid) || null,
    }));

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/bookings/:id/init-payment
 */
router.post("/:id/init-payment", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customerUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (booking.status !== "ACCEPTED") {
      return res.status(400).json({
        success: false,
        message: "Booking must be ACCEPTED to pay",
      });
    }

    if (booking.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    if (typeof booking.price !== "number" || booking.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Booking price is missing or invalid",
      });
    }

    const user = await User.findOne({ uid: booking.customerUid }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const currency = process.env.PAYHERE_CURRENCY || "LKR";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const publicNotifyBase = process.env.PUBLIC_NOTIFY_BASE_URL;

    if (!merchantId || !merchantSecret || !publicNotifyBase) {
      return res.status(500).json({
        success: false,
        message: "PayHere environment variables are missing",
      });
    }

    const amount = formatAmount(booking.price);
    const orderId = `BOOKING_${booking._id}_${Date.now()}`;

    const hash = generatePayHereHash({
      merchantId,
      orderId,
      amount,
      currency,
      merchantSecret,
    });

    booking.payhereOrderId = orderId;
    booking.paymentMessage = "Payment initiated";
    await booking.save();

    const fullName = (user.name || "Customer").trim();
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "User";

    return res.json({
      success: true,
      data: {
        checkoutUrl: "https://sandbox.payhere.lk/pay/checkout",
        payment: {
          merchant_id: merchantId,
          return_url: `${clientUrl}/customer/my-bookings?payment=return&bookingId=${booking._id}`,
          cancel_url: `${clientUrl}/customer/my-bookings?payment=cancel&bookingId=${booking._id}`,
          notify_url: `${publicNotifyBase}/api/bookings/payhere/notify`,
          order_id: orderId,
          items: `Artist Booking ${booking._id}`,
          currency,
          amount,
          first_name: firstName,
          last_name: lastName,
          email: user.email || "customer@example.com",
          phone: user.organizerProfile?.phone || "0770000000",
          address: user.organizerProfile?.location || "Sri Lanka",
          city: "Colombo",
          country: "Sri Lanka",
          custom_1: String(booking._id),
          custom_2: String(booking.customerUid),
          hash,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/bookings/payhere/notify
 */
router.post("/payhere/notify", async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      status_message,
    } = req.body || {};

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;

    if (
      !merchant_id ||
      !order_id ||
      !payhere_amount ||
      !payhere_currency ||
      !status_code ||
      !md5sig
    ) {
      return res.status(400).send("Missing required params");
    }

    if (merchant_id !== expectedMerchantId) {
      return res.status(400).send("Invalid merchant");
    }

    const expectedSig = generatePayHereMd5Sig({
      merchantId: merchant_id,
      orderId: order_id,
      payhereAmount: payhere_amount,
      payhereCurrency: payhere_currency,
      statusCode: status_code,
      merchantSecret,
    });

    if (expectedSig !== md5sig) {
      return res.status(400).send("Invalid signature");
    }

    const booking = await Booking.findOne({ payhereOrderId: order_id });

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    if (String(status_code) === "2") {
      booking.paymentStatus = "PAID";
      booking.status = "CONFIRMED";
      booking.paidAt = new Date();
      booking.paymentRef = payment_id || "";
      booking.amountPaid = Number(payhere_amount);
      booking.paymentMessage = status_message || "Payment successful";
      await booking.save();
    } else if (String(status_code) === "0") {
      booking.paymentStatus = "UNPAID";
      booking.paymentMessage = status_message || "Payment pending";
      await booking.save();
    } else {
      booking.paymentStatus = "UNPAID";
      booking.paymentMessage = status_message || "Payment unsuccessful";
      await booking.save();
    }

    return res.status(200).send("OK");
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

/**
 * GET /api/bookings/:id/payment-status
 */
router.get("/:id/payment-status", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customerUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMessage: booking.paymentMessage || "",
        paymentRef: booking.paymentRef || "",
        amountPaid: booking.amountPaid,
        paidAt: booking.paidAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * PATCH /api/bookings/:id/markPaid
 */
router.patch("/:id/markPaid", requireAuth, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Direct markPaid is disabled. Use PayHere payment flow.",
  });
});

/**
 * PATCH /api/bookings/:id/note
 * Customers can update booking details before payment confirmation.
 */
router.patch("/:id/note", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customerUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (
      !["PENDING", "ACCEPTED"].includes(booking.status) ||
      booking.paymentStatus === "PAID"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking details can no longer be edited",
      });
    }

    const { note, eventLocation, eventType } = req.body || {};

    if (
      (note !== undefined && typeof note !== "string") ||
      typeof eventLocation !== "string" ||
      typeof eventType !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Note, event location, and event type must be strings",
      });
    }

    const normalizedNote = String(note || "").trim();
    const normalizedEventLocation = eventLocation.trim();
    const normalizedEventType = eventType.trim();

    if (!normalizedEventLocation || !normalizedEventType) {
      return res.status(400).json({
        success: false,
        message: "Event location and event type are required",
      });
    }

    if (
      normalizedNote.length > 1000 ||
      normalizedEventLocation.length > 300 ||
      normalizedEventType.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking details exceed the allowed length",
      });
    }

    booking.note = normalizedNote;
    booking.eventLocation = normalizedEventLocation;
    booking.eventType = normalizedEventType;
    await booking.save();

    return res.json({
      success: true,
      message: "Booking details updated successfully",
      data: booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * PATCH /api/bookings/:id/cancel
 */
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customerUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (["CANCELLED", "REJECTED", "EXPIRED"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking is already closed",
      });
    }

    booking.status = "CANCELLED";

    if (booking.paymentStatus === "PAID") {
      booking.paymentMessage = "Booking cancelled after payment";
    } else {
      booking.paymentMessage = "Booking cancelled";
    }

    await booking.save();

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
    });

    if (slot) {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.heldBy = null;
      slot.bookingId = null;
      await slot.save();
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;