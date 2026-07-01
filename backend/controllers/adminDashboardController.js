import User from "../models/user.js";
import Chord from "../models/chord.js";
import Booking from "../models/Booking.js";
import Review from "../models/review.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalArtists = await User.countDocuments({
      $or: [
        { role: "artist" },
        { userRole: "artist" },
        { accountType: "artist" },
        { userType: "artist" },
      ],
    });

    const totalCustomers = await User.countDocuments({
      $or: [
        { role: "customer" },
        { userRole: "customer" },
        { accountType: "customer" },
        { userType: "customer" },
      ],
    });

    const totalBookings = await Booking.countDocuments();
    const totalChords = await Chord.countDocuments();
    const totalReviews = await Review.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalArtists,
        totalCustomers,
        totalBookings,
        totalChords,
        totalReviews,
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