import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    organizerUid: { type: String, required: true, unique: true, index: true },
    plan: {
      type: String,
      enum: ["premium"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    payhereOrderId: { type: String, default: "", index: true },
    paymentRef: { type: String, default: "" },
    paymentMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
