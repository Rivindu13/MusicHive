import express from "express";
import crypto from "crypto";
import Chord from "../models/Chord.js";
import {
  createChord,
  getChordsByArtist,
  getChordsByCustomer,
  getAllChords,
  deleteChord,
} from "../controllers/chordController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * Create chord
 * POST /api/chords
 */
router.post("/", createChord);

/**
 * Explore all chords
 * GET /api/chords/explore?search=&genre=
 */
router.get("/explore", getAllChords);

/**
 * Artist chords
 * GET /api/chords/artist/:uid
 */
router.get("/artist/:uid", getChordsByArtist);

/**
 * Customer chords
 * GET /api/chords/customer/:uid
 */
router.get("/customer/:uid", getChordsByCustomer);

/**
 * Purchased chord IDs
 * GET /api/chords/purchased/:uid
 */
router.get("/purchased/:uid", requireAuth, async (req, res) => {
  try {
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findOne({ uid: req.params.uid }).select("purchasedChords");
    return res.json({
      success: true,
      data: user?.purchasedChords || [],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Buy a chord
 * POST /api/chords/:id/purchase
 */
router.post("/:id/purchase", requireAuth, async (req, res) => {
  try {
    const chord = await Chord.findById(req.params.id).lean();
    if (!chord) {
      return res.status(404).json({ success: false, message: "Chord not found" });
    }

    await User.updateOne(
      { uid: req.user.uid },
      { $addToSet: { purchasedChords: String(chord._id) } }
    );

    return res.json({
      success: true,
      message: "Chord purchased successfully",
      data: { chordId: String(chord._id), price: chord.price || 0 },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Start PayHere checkout for a chord
 * POST /api/chords/:id/init-payment
 */
router.post("/:id/init-payment", requireAuth, async (req, res) => {
  try {
    const chord = await Chord.findById(req.params.id).lean();
    const user = await User.findOne({ uid: req.user.uid }).lean();

    if (!chord) {
      return res.status(404).json({ success: false, message: "Chord not found" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    if (typeof chord.price !== "number" || chord.price <= 0) {
      return res.status(400).json({ success: false, message: "Chord is free" });
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

    const amount = Number(chord.price).toFixed(2);
    const orderId = `CHORD_${chord._id}_${Date.now()}`;
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret)
      .digest("hex")
      .toUpperCase();
    const hash = crypto
      .createHash("md5")
      .update(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`)
      .digest("hex")
      .toUpperCase();
    const fullName = (user.name || "Customer").trim().split(" ");

    return res.json({
      success: true,
      data: {
        checkoutUrl: "https://sandbox.payhere.lk/pay/checkout",
        payment: {
          merchant_id: merchantId,
          return_url: `${clientUrl}/customer/chords?payment=return&chordId=${chord._id}`,
          cancel_url: `${clientUrl}/customer/chords?payment=cancel&chordId=${chord._id}`,
          notify_url: `${publicNotifyBase}/api/chords/payhere/notify`,
          order_id: orderId,
          items: `Chord ${chord.title || chord._id}`,
          currency,
          amount,
          first_name: fullName[0] || "Customer",
          last_name: fullName.slice(1).join(" ") || "User",
          email: user.email || "customer@example.com",
          phone: user.organizerProfile?.phone || "0770000000",
          address: user.organizerProfile?.location || "Sri Lanka",
          city: "Colombo",
          country: "Sri Lanka",
          custom_1: String(chord._id),
          custom_2: String(req.user.uid),
          hash,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/payhere/notify", async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1,
      custom_2,
    } = req.body || {};
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;

    if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
      return res.status(400).send("Missing required params");
    }
    if (merchant_id !== expectedMerchantId) return res.status(400).send("Invalid merchant");

    const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const expectedSig = crypto
      .createHash("md5")
      .update(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`)
      .digest("hex")
      .toUpperCase();
    if (expectedSig !== md5sig) return res.status(400).send("Invalid signature");

    if (String(status_code) === "2" && order_id.startsWith("CHORD_")) {
      const chordId = custom_1 || order_id.split("_")[1];
      const customerUid = custom_2;
      if (!customerUid) return res.status(400).send("Missing customer");
      const chord = await Chord.findById(chordId).lean();
      if (!chord) return res.status(404).send("Chord not found");
      await User.updateOne(
        { uid: customerUid },
        { $addToSet: { purchasedChords: String(chord._id) } }
      );
    }

    return res.status(200).send("OK");
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

/**
 * Delete chord
 * DELETE /api/chords/:id
 * Body: { uid }
 */
router.delete("/:id", deleteChord);

/**
 * Add review
 * POST /api/chords/:id/reviews
 * Body: { uid, name, photoURL, rating, text }
 */
router.post("/:id/reviews", async (req, res) => {
  try {
    const { uid, name, photoURL, rating, text } = req.body;

    if (!uid || !name || rating == null) {
      return res.status(400).json({ message: "uid, name, rating required" });
    }

    const numRating = Number(rating);
    if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const chord = await Chord.findById(req.params.id);
    if (!chord) {
      return res.status(404).json({ message: "Chord not found" });
    }

    const already = chord.reviews.find((r) => String(r.uid) === String(uid));
    if (already) {
      return res.status(400).json({ message: "You already reviewed this chord" });
    }

    chord.reviews.push({
      uid,
      name,
      photoURL: photoURL || "",
      rating: numRating,
      text: text || "",
    });

    await chord.save();
    return res.json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * Delete review
 * DELETE /api/chords/:id/reviews/:reviewId
 * Body: { uid }
 */
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const chord = await Chord.findById(req.params.id);
    if (!chord) {
      return res.status(404).json({ message: "Chord not found" });
    }

    const review = chord.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.uid) !== String(uid)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    review.deleteOne();
    await chord.save();

    return res.json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;