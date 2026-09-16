import crypto from "crypto";
import express from "express";
import User from "../models/user.js";
import Subscription from "../models/Subscription.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
const PLANS = {
  premium: { amount: 5500, label: "Premium" },
};

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

function createHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${secretHash}`)
    .digest("hex")
    .toUpperCase();
}

function createNotifySignature({
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  merchantSecret,
}) {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`)
    .digest("hex")
    .toUpperCase();
}

function getDiscount(completedEventsCount, subscription) {
  if (
    !subscription ||
    subscription.plan !== "premium" ||
    subscription.status !== "ACTIVE"
  ) {
    return 0;
  }

  if (completedEventsCount >= 11) return 15;
  if (completedEventsCount >= 6) return 10;
  if (completedEventsCount >= 3) return 5;
  return 0;
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid })
    .select("uid role completedEventsCount organizerProfile.subscriptionPlan")
    .lean();

  if (!user || user.role !== "organizer") {
    return res.status(403).json({ success: false, message: "Only event organizers can subscribe." });
  }

  const subscription = await Subscription.findOne({
    organizerUid: req.user.uid,
  }).lean();

  if (
    subscription?.status === "ACTIVE" &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt) <= new Date()
  ) {
    await Subscription.updateOne(
      { _id: subscription._id, status: "ACTIVE" },
      { $set: { status: "EXPIRED" } }
    );
    subscription.status = "EXPIRED";
  }

  const completedEvents = user.completedEventsCount || 0;
  const discountPercent = getDiscount(completedEvents, subscription);
  return res.json({
    success: true,
    data: {
      subscription,
      completedEvents,
      discountPercent,
      plans: {
        free: { amount: 0, label: "Free" },
        ...PLANS,
      },
    },
  });
});

router.post("/init-payment", requireAuth, async (req, res) => {
  try {
    const { plan } = req.body || {};
    const selectedPlan = PLANS[plan];
    const user = await User.findOne({ uid: req.user.uid });

    if (!user || user.role !== "organizer") {
      return res.status(403).json({
        success: false,
        message: "Only event organizers can subscribe.",
      });
    }

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid paid subscription plan.",
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

    const paymentAmount = formatAmount(selectedPlan.amount);
    const orderId = `SUBSCRIPTION_${user._id}_${Date.now()}`;
    const existing = await Subscription.findOne({ organizerUid: user.uid });
    const subscription =
      existing ||
      new Subscription({
        organizerUid: user.uid,
        plan,
        amount: selectedPlan.amount,
      });

    subscription.plan = plan;
    subscription.amount = selectedPlan.amount;
    subscription.status = "PENDING";
    subscription.payhereOrderId = orderId;
    subscription.paymentMessage = "Payment initiated";
    await subscription.save();

    const fullName = (user.name || "Organizer").trim().split(" ");
    const firstName = fullName[0] || "Organizer";
    const lastName = fullName.slice(1).join(" ") || "User";

    return res.json({
      success: true,
      data: {
        checkoutUrl: "https://sandbox.payhere.lk/pay/checkout",
        payment: {
          merchant_id: merchantId,
          return_url: `${clientUrl}/customer/profile?subscription=return`,
          cancel_url: `${clientUrl}/customer/profile?subscription=cancel`,
          notify_url: `${publicNotifyBase}/api/subscriptions/payhere/notify`,
          order_id: orderId,
          items: `MusicHive ${selectedPlan.label} Subscription`,
          currency,
          amount: paymentAmount,
          first_name: firstName,
          last_name: lastName,
          email: user.email || "organizer@example.com",
          phone: user.organizerProfile?.phone || "0770000000",
          address: user.organizerProfile?.location || "Sri Lanka",
          city: "Colombo",
          country: "Sri Lanka",
          custom_1: String(user.uid),
          custom_2: plan,
          hash: createHash({
            merchantId,
            orderId,
            amount: paymentAmount,
            currency,
            merchantSecret,
          }),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initialize subscription payment.",
      error: error.message,
    });
  }
});

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

    if (
      !merchant_id ||
      !order_id ||
      !payhere_amount ||
      !payhere_currency ||
      !status_code ||
      !md5sig ||
      merchant_id !== process.env.PAYHERE_MERCHANT_ID
    ) {
      return res.status(400).send("Invalid payment parameters");
    }

    const expectedSignature = createNotifySignature({
      merchantId: merchant_id,
      orderId: order_id,
      amount: payhere_amount,
      currency: payhere_currency,
      statusCode: status_code,
      merchantSecret,
    });

    if (expectedSignature !== md5sig) {
      return res.status(400).send("Invalid signature");
    }

    const subscription = await Subscription.findOne({ payhereOrderId: order_id });
    if (!subscription) return res.status(404).send("Subscription not found");

    if (String(status_code) === "2") {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      subscription.status = "ACTIVE";
      subscription.startedAt = startedAt;
      subscription.expiresAt = expiresAt;
      subscription.paymentRef = payment_id || "";
      subscription.paymentMessage = status_message || "Payment successful";

      await User.updateOne(
        { uid: subscription.organizerUid, role: "organizer" },
        { $set: { "organizerProfile.subscriptionPlan": subscription.plan } }
      );
    } else {
      subscription.status = "PENDING";
      subscription.paymentMessage = status_message || "Payment unsuccessful";
    }

    await subscription.save();
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Subscription PayHere notification failed:", error.message);
    return res.status(500).send("Server error");
  }
});

export default router;
