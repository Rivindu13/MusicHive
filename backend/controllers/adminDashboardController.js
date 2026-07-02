import User from "../models/user.js";
import Chord from "../models/chord.js";
import Booking from "../models/Booking.js";
import Review from "../models/review.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalArtists = await User.countDocuments({ role: "artist" });
    const totalBands = await User.countDocuments({ role: "band" });
    const totalOrganizers = await User.countDocuments({ role: "organizer" });

    const totalBookings = await Booking.countDocuments();
    const totalChords = await Chord.countDocuments();
    const totalReviews = await Review.countDocuments();

    const activeUsers = await User.countDocuments({
      $or: [{ isBlocked: false }, { isBlocked: { $exists: false } }],
    });

    const blockedUsers = await User.countDocuments({
      isBlocked: true,
    });

    const recentUsers = await User.find()
      .select("name email role photoURL status isBlocked createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalArtists,
        totalBands,
        totalOrganizers,
        totalBookings,
        totalChords,
        totalReviews,
        activeUsers,
        blockedUsers,
        recentUsers,
        recentBookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics.",
      error: error.message,
    });
  }
};