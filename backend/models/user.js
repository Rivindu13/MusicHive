import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },

  role: {
    type: String,
    required: true,
    enum: ["artist", "band", "organizer"], // 👈 enforce valid roles
  },

  photoURL: { type: String, default: null },

  // 🔥 ARTIST/BAND-SPECIFIC DATA (use when role = artist / band)
  artistProfile: {
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    genres: {
      type: [String],
      default: [],
    },

    location: {
      type: String,
      default: "",
    },

    pricePerHour: {
      type: Number,
      default: null,
    },

    instruments: {
      type: [String],
      default: [],
    },

    socials: {
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      spotify: { type: String, default: "" },
    },

    // ✅ NEW: Band members (only meaningful if role === "band")
    bandMembers: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          position: { type: String, required: true, trim: true }, // e.g., "Guitarist", "Keyboardist"
        },
      ],
      default: [],
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
