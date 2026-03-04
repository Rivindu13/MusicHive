import express from "express";
import User from "../models/user.js";

const router = express.Router();

/**
 * CREATE user (your existing)
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
        role,      // "artist" | "band" | "organizer"
        name,
        photoURL,
      });
    }

    return res.json(user);
  } catch (err) {
    console.error("POST /users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET all artists/bands for customer booking page
// /api/users/artists?genre=Pop&search=ave&onlyComplete=true
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
      query["artistProfile.genres"] = genre; // matches if genre is inside array
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
      .select("uid name role photoURL artistProfile.location artistProfile.genres artistProfile.pricePerHour artistProfile.instruments")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: artists });
  } catch (err) {
    console.error("GET /users/artists error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET user (your existing)
 */
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    return res.json(user);
  } catch (err) {
    console.error("GET /users/:uid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ UPDATE profile fields (NEW)
 * Frontend profile page should call this.
 *
 * PATCH /api/users/:uid/profile
 * body can include:
 * - name, photoURL
 * - artistProfile: { bio, genres, location, pricePerHour, instruments, socials, bandMembers, isProfileComplete }
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
    } = req.body;

    // ✅ Update top-level safe fields
    if (typeof name === "string") user.name = name;
    if (typeof photoURL === "string") user.photoURL = photoURL;

    // ✅ Only update artistProfile if role is artist/band
    const canHaveArtistProfile = user.role === "artist" || user.role === "band";
    if (canHaveArtistProfile && artistProfile && typeof artistProfile === "object") {
      // basic fields
      if (typeof artistProfile.bio === "string") user.artistProfile.bio = artistProfile.bio;
      if (typeof artistProfile.location === "string") user.artistProfile.location = artistProfile.location;

      // arrays
      if (Array.isArray(artistProfile.genres)) user.artistProfile.genres = artistProfile.genres;
      if (Array.isArray(artistProfile.instruments)) user.artistProfile.instruments = artistProfile.instruments;

      // price
      if (
        artistProfile.pricePerHour === null ||
        typeof artistProfile.pricePerHour === "number"
      ) {
        user.artistProfile.pricePerHour = artistProfile.pricePerHour;
      }

      // socials
      if (artistProfile.socials && typeof artistProfile.socials === "object") {
        user.artistProfile.socials.instagram =
          typeof artistProfile.socials.instagram === "string"
            ? artistProfile.socials.instagram
            : user.artistProfile.socials.instagram;

        user.artistProfile.socials.youtube =
          typeof artistProfile.socials.youtube === "string"
            ? artistProfile.socials.youtube
            : user.artistProfile.socials.youtube;

        user.artistProfile.socials.spotify =
          typeof artistProfile.socials.spotify === "string"
            ? artistProfile.socials.spotify
            : user.artistProfile.socials.spotify;
      }

      // ✅ bandMembers only if role === "band"
      if (user.role === "band") {
        if (Array.isArray(artistProfile.bandMembers)) {
          // sanitize entries
          const cleaned = artistProfile.bandMembers
            .filter((m) => m && typeof m === "object")
            .map((m) => ({
              name: String(m.name || "").trim(),
              position: String(m.position || "").trim(),
            }))
            .filter((m) => m.name && m.position);

          user.artistProfile.bandMembers = cleaned;
        }
      } else {
        // If not a band, ignore bandMembers updates (or optionally clear it)
        // user.artistProfile.bandMembers = [];
      }

      // profile complete flag (optional)
      if (typeof artistProfile.isProfileComplete === "boolean") {
        user.artistProfile.isProfileComplete = artistProfile.isProfileComplete;
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
