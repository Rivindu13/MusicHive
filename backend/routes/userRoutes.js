import express from "express";
import User from "../models/User.js";
import { bucket } from "../config/firebaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

function getFirebasePathFromUrl(fileUrl) {
  try {
    const decodedUrl = decodeURIComponent(fileUrl);
    const match = decodedUrl.match(/\/o\/(.+?)\?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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
        wishlist: [],
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
    const {
      genre,
      search,
      onlyComplete,
      instrument,
      category,
      minPrice,
      maxPrice,
    } = req.query;

    const query = {};

    if (category && (category === "artist" || category === "band")) {
      query.role = category;
    } else {
      query.role = { $in: ["artist", "band"] };
    }

    if (onlyComplete === "true") {
      query["artistProfile.isProfileComplete"] = true;
    }

    if (genre && genre !== "All Genres") {
      query["artistProfile.genres"] = genre;
    }

    if (instrument && instrument.trim()) {
      const escapedInstrument = instrument.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query["artistProfile.instruments"] = {
        $regex: `^${escapedInstrument}$`,
        $options: "i",
      };
    }

    const parsedMinPrice = minPrice === undefined ? null : Number(minPrice);
    const parsedMaxPrice = maxPrice === undefined ? null : Number(maxPrice);

    if (
      (parsedMinPrice !== null &&
        (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)) ||
      (parsedMaxPrice !== null &&
        (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0)) ||
      (parsedMinPrice !== null &&
        parsedMaxPrice !== null &&
        parsedMinPrice > parsedMaxPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be non-negative numbers with minPrice <= maxPrice",
      });
    }

    if (parsedMinPrice !== null || parsedMaxPrice !== null) {
      query["artistProfile.pricePerHour"] = {};
      if (parsedMinPrice !== null) {
        query["artistProfile.pricePerHour"].$gte = parsedMinPrice;
      }
      if (parsedMaxPrice !== null) {
        query["artistProfile.pricePerHour"].$lte = parsedMaxPrice;
      }
    }

    if (search && search.trim()) {
      const s = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
 * Get wishlist by user uid
 */
router.get("/:uid/wishlist", requireAuth, async (req, res) => {
  try {
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ success: false, message: "You can only access your own wishlist" });
    }

    const user = await User.findOne({ uid: req.params.uid }).select(
      "uid role wishlist"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user.wishlist || [],
    });
  } catch (err) {
    console.error("GET /users/:uid/wishlist error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Toggle wishlist
 * POST /api/users/wishlist/toggle
 */
router.post("/wishlist/toggle", requireAuth, async (req, res) => {
  try {
    const { uid, artistUid } = req.body;

    if (!uid || !artistUid) {
      return res.status(400).json({
        success: false,
        message: "uid and artistUid are required",
      });
    }

    if (req.user.uid !== uid) {
      return res.status(403).json({ success: false, message: "You can only update your own wishlist" });
    }

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "organizer") {
      return res.status(403).json({
        success: false,
        message: "Only organizers can use wishlist",
      });
    }

    const artist = await User.findOne({
      uid: artistUid,
      role: { $in: ["artist", "band"] },
    }).select("uid");

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const alreadySaved = user.wishlist.includes(artistUid);

    if (alreadySaved) {
      user.wishlist = user.wishlist.filter((id) => id !== artistUid);
    } else {
      user.wishlist.push(artistUid);
    }

    await user.save();

    return res.json({
      success: true,
      message: alreadySaved ? "Removed from wishlist" : "Added to wishlist",
      data: user.wishlist,
      wished: !alreadySaved,
    });
  } catch (err) {
    console.error("POST /users/wishlist/toggle error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Remove one artist from wishlist
 * POST /api/users/wishlist/remove
 */
router.post("/wishlist/remove", requireAuth, async (req, res) => {
  try {
    const { uid, artistUid } = req.body;

    if (!uid || !artistUid) {
      return res.status(400).json({
        success: false,
        message: "uid and artistUid are required",
      });
    }

    if (req.user.uid !== uid) {
      return res.status(403).json({ success: false, message: "You can only update your own wishlist" });
    }

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    user.wishlist = user.wishlist.filter((id) => id !== artistUid);
    await user.save();

    return res.json({
      success: true,
      message: "Removed from wishlist",
      data: user.wishlist,
    });
  } catch (err) {
    console.error("POST /users/wishlist/remove error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * Get full artist objects for a user's wishlist
 * GET /api/users/:uid/wishlist/artists
 */
router.get("/:uid/wishlist/artists", requireAuth, async (req, res) => {
  try {
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ success: false, message: "You can only access your own wishlist" });
    }

    const user = await User.findOne({ uid: req.params.uid }).select("wishlist");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const wishlistIds = Array.isArray(user.wishlist) ? user.wishlist : [];

    if (wishlistIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const artists = await User.find({
      uid: { $in: wishlistIds },
      role: { $in: ["artist", "band"] },
    })
      .select(
        "uid name role photoURL artistProfile.location artistProfile.genres artistProfile.pricePerHour artistProfile.instruments artistProfile.bio"
      )
      .lean();

    const sortedArtists = wishlistIds
      .map((id) => artists.find((artist) => artist.uid === id))
      .filter(Boolean);

    return res.json({
      success: true,
      data: sortedArtists,
    });
  } catch (err) {
    console.error("GET /users/:uid/wishlist/artists error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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

    if (typeof name === "string") {
      user.name = name.trim();
    }

    // Delete old Firebase profile photo when new photoURL is saved
    if (typeof photoURL === "string" || photoURL === null) {
      const oldPhotoURL = user.photoURL;

      if (oldPhotoURL && oldPhotoURL !== photoURL) {
        const oldFilePath = getFirebasePathFromUrl(oldPhotoURL);

        if (oldFilePath) {
          try {
            await bucket.file(oldFilePath).delete();
          } catch (firebaseErr) {
            console.log("Old profile photo delete failed:", firebaseErr.message);
          }
        }
      }

      user.photoURL = photoURL;
    }

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

    if (user.role === "organizer" && organizerProfile) {
      if (
        organizerProfile.subscriptionPlan !== undefined &&
        !["free", "premium"].includes(
          organizerProfile.subscriptionPlan
        )
      ) {
        return res.status(400).json({
          message: "Invalid subscription plan.",
        });
      }

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

      if (organizerProfile.subscriptionPlan === "free") {
        user.organizerProfile.subscriptionPlan =
          organizerProfile.subscriptionPlan;
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

/**
 * PATCH /api/users/:uid/subscription
 * Update organizer subscription tier (Free, Pro, Premium)
 */
router.patch("/:uid/subscription", async (req, res) => {
  try {
    const { subscriptionStatus } = req.body;
    if (!["Free", "Pro", "Premium"].includes(subscriptionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscriptionStatus. Must be Free, Pro, or Premium.",
      });
    }

    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.organizerProfile) {
      user.organizerProfile = {};
    }

    user.organizerProfile.subscriptionStatus = subscriptionStatus;
    await user.save();

    return res.json({
      success: true,
      message: `Subscription successfully updated to ${subscriptionStatus}`,
      subscriptionStatus: user.organizerProfile.subscriptionStatus,
      user,
    });
  } catch (err) {
    console.error("PATCH /users/:uid/subscription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;