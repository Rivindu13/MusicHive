import Review from "../models/review.js";
import User from "../models/user.js";

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("bookingId")
      .sort({ createdAt: -1 });

    const allUids = [
      ...new Set(
        reviews.flatMap((review) => [review.reviewerUid, review.revieweeUid])
      ),
    ];

    const users = await User.find({ uid: { $in: allUids } }).select(
      "uid name email role photoURL"
    );

    const userMap = {};
    users.forEach((user) => {
      userMap[user.uid] = user;
    });

    const enrichedReviews = reviews.map((review) => ({
      ...review.toObject(),
      reviewer: userMap[review.reviewerUid] || null,
      reviewee: userMap[review.revieweeUid] || null,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedReviews.length,
      data: enrichedReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load reviews.",
      error: error.message,
    });
  }
};

export const getSingleReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("bookingId");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const reviewer = await User.findOne({ uid: review.reviewerUid }).select(
      "uid name email role photoURL"
    );

    const reviewee = await User.findOne({ uid: review.revieweeUid }).select(
      "uid name email role photoURL"
    );

    return res.status(200).json({
      success: true,
      data: {
        ...review.toObject(),
        reviewer,
        reviewee,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load review.",
      error: error.message,
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete review.",
      error: error.message,
    });
  }
};