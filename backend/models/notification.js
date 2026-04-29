import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientUid: {
      type: String,
      required: true,
      index: true,
    },

    senderUid: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["NEW_BOOKING", "BOOKING_ACCEPTED"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);