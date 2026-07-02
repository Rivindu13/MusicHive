import Booking from "../models/Booking.js";
import User from "../models/user.js";

export const getAllBookings = async (req, res) => {
  try {
    const { status = "", paymentStatus = "" } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    const allUids = [
      ...new Set(
        bookings.flatMap((booking) => [
          booking.artistUid,
          booking.customerUid,
        ])
      ),
    ];

    const users = await User.find({ uid: { $in: allUids } }).select(
      "uid name email role photoURL"
    );

    const userMap = {};
    users.forEach((user) => {
      userMap[user.uid] = user;
    });

    const enrichedBookings = bookings.map((booking) => {
      const bookingObj = booking.toObject();

      return {
        ...bookingObj,
        artist: userMap[booking.artistUid] || null,
        customer: userMap[booking.customerUid] || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      data: enrichedBookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load bookings.",
      error: error.message,
    });
  }
};

export const getSingleBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const artist = await User.findOne({ uid: booking.artistUid }).select(
      "uid name email role photoURL"
    );

    const customer = await User.findOne({ uid: booking.customerUid }).select(
      "uid name email role photoURL"
    );

    return res.status(200).json({
      success: true,
      data: {
        ...booking.toObject(),
        artist,
        customer,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load booking.",
      error: error.message,
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "ACCEPTED",
      "REJECTED",
      "CONFIRMED",
      "CANCELLED",
      "EXPIRED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking status is required.",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status.",
      error: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowedStatuses = ["UNPAID", "PAID", "REFUNDED"];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid payment status is required.",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status.",
      error: error.message,
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete booking.",
      error: error.message,
    });
  }
};