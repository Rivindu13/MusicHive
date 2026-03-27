import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * Create user
 * Used at signup/login
 */
router.post("/", async (req, res) => {
  try {
    const { uid, email, role, name, photoURL } = req.body;

    if (!uid || !email || !role) {
      return res.status(400).json({ message: "uid, email, role are required" });
    }

    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({
        uid,
        email,
        role,
        name: name || "",
        photoURL: photoURL || null,
      });
    }

    return res.json(user);
  } catch (err) {
    console.error("POST /users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get all artists/bands
 */
router.get("/artists", async (req, res) => {
  try {
    const { genre, search, onlyComplete } = req.query;

    const query = {
      role: { $in: ["artist", "band"] },
    };

    if (onlyComplete === "true") {
      query["artistProfile.isProfileComplete"] = true;
    }

    if (genre && genre !== "All Genres") {
      query["artistProfile.genres"] = genre;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { "artistProfile.location": { $regex: s, $options: "i" } },
        { "artistProfile.instruments": { $regex: s, $options: "i" } },
        { "artistProfile.genres": { $regex: s, $options: "i" } },
      ];
    }

    const artists = await User.find(query)
      .select(
        "uid name role photoURL artistProfile.location artistProfile.genres artistProfile.pricePerHour artistProfile.instruments artistProfile.bio"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: artists });
  } catch (err) {
    console.error("GET /users/artists error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get single user by uid
 */
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("GET /users/:uid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Update profile
 * PATCH /api/users/:uid/profile
 */
router.patch("/:uid/profile", async (req, res) => {
  try {
    const uid = req.params.uid;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      name,
      photoURL,
      artistProfile = {},
      organizerProfile = {},
    } = req.body;

    // =========================
    // Top-level common fields
    // =========================
    if (typeof name === "string") {
      user.name = name.trim();
    }

    if (typeof photoURL === "string" || photoURL === null) {
      user.photoURL = photoURL;
    }

    // =========================
    // Artist / Band update
    // =========================
    if ((user.role === "artist" || user.role === "band") && artistProfile) {
      if (typeof artistProfile.bio === "string") {
        user.artistProfile.bio = artistProfile.bio;
      }

      if (typeof artistProfile.location === "string") {
        user.artistProfile.location = artistProfile.location;
      }

      if (Array.isArray(artistProfile.genres)) {
        user.artistProfile.genres = artistProfile.genres
          .map((item) => String(item).trim())
          .filter(Boolean);
      }

      if (Array.isArray(artistProfile.instruments)) {
        user.artistProfile.instruments = artistProfile.instruments
          .map((item) => String(item).trim())
          .filter(Boolean);
      }

      if (
        artistProfile.pricePerHour === null ||
        typeof artistProfile.pricePerHour === "number"
      ) {
        user.artistProfile.pricePerHour = artistProfile.pricePerHour;
      }

      if (artistProfile.socials && typeof artistProfile.socials === "object") {
        if (typeof artistProfile.socials.instagram === "string") {
          user.artistProfile.socials.instagram = artistProfile.socials.instagram;
        }

        if (typeof artistProfile.socials.youtube === "string") {
          user.artistProfile.socials.youtube = artistProfile.socials.youtube;
        }

        if (typeof artistProfile.socials.spotify === "string") {
          user.artistProfile.socials.spotify = artistProfile.socials.spotify;
        }
      }

      if (user.role === "band" && Array.isArray(artistProfile.bandMembers)) {
        const cleanedMembers = artistProfile.bandMembers
          .filter((member) => member && typeof member === "object")
          .map((member) => ({
            name: String(member.name || "").trim(),
            position: String(member.position || "").trim(),
          }))
          .filter((member) => member.name && member.position);

        user.artistProfile.bandMembers = cleanedMembers;
      }

      if (typeof artistProfile.isProfileComplete === "boolean") {
        user.artistProfile.isProfileComplete = artistProfile.isProfileComplete;
      }
    }

    // =========================
    // Organizer update
    // =========================
    if (user.role === "organizer" && organizerProfile) {
      if (typeof organizerProfile.phone === "string") {
        user.organizerProfile.phone = organizerProfile.phone;
      }

      if (typeof organizerProfile.organizationName === "string") {
        user.organizerProfile.organizationName =
          organizerProfile.organizationName;
      }

      if (typeof organizerProfile.eventType === "string") {
        user.organizerProfile.eventType = organizerProfile.eventType;
      }

      if (typeof organizerProfile.location === "string") {
        user.organizerProfile.location = organizerProfile.location;
      }

      if (typeof organizerProfile.bio === "string") {
        user.organizerProfile.bio = organizerProfile.bio;
      }

      if (Array.isArray(organizerProfile.preferredGenres)) {
        user.organizerProfile.preferredGenres = organizerProfile.preferredGenres
          .map((item) => String(item).trim())
          .filter(Boolean);
      }

      if (typeof organizerProfile.budgetRange === "string") {
        user.organizerProfile.budgetRange = organizerProfile.budgetRange;
      }

      if (typeof organizerProfile.instagram === "string") {
        user.organizerProfile.instagram = organizerProfile.instagram;
      }

      if (typeof organizerProfile.website === "string") {
        user.organizerProfile.website = organizerProfile.website;
      }

      if (typeof organizerProfile.isProfileComplete === "boolean") {
        user.organizerProfile.isProfileComplete =
          organizerProfile.isProfileComplete;
      }
    }

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error("PATCH /users/:uid/profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;