import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },

  role: {
    type: String,
    required: true,
    enum: ["artist", "band", "organizer"],
  },

  photoURL: { type: String, default: null },

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

    bandMembers: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          position: { type: String, required: true, trim: true },
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

// ✅ FIX: prevent OverwriteModelError on reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;