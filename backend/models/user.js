import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { 
    type: String, 
    required: true, 
    unique: true 
  },

  email: { 
    type: String, 
    required: true 
  },

  name: { 
    type: String, 
    default: "" 
  },

  role: {
    type: String,
    required: true,
    enum: ["artist", "band", "organizer"],
  },

  photoURL: { 
    type: String, 
    default: null 
  },

  // =========================
  // Admin account control
  // =========================
  isBlocked: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["active", "blocked"],
    default: "active",
  },

  // =========================
  // Wishlist
  // =========================
  wishlist: {
    type: [String], // artist UIDs
    default: [],
  },

  // =========================
  // Artist / Band profile
  // =========================
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

  // =========================
  // Organizer / Customer profile
  // =========================
  organizerProfile: {
    phone: {
      type: String,
      default: "",
    },

    organizationName: {
      type: String,
      default: "",
    },

    eventType: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    preferredGenres: {
      type: [String],
      default: [],
    },

    budgetRange: {
      type: String,
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;