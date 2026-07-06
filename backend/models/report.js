import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    reporterUid: { type: String, required: true },
    reporterName: { type: String, default: "" },
    reporterRole: {
      type: String,
      enum: ["artist", "band", "organizer"],
      required: true,
    },

    reportedUid: { type: String, required: true },
    reportedName: { type: String, default: "" },
    reportedRole: {
      type: String,
      enum: ["artist", "band", "organizer"],
      required: true,
    },

    reason: { type: String, required: true },
    description: { type: String, required: true },

    evidenceUrls: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;