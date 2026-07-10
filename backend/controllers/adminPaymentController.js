import Booking from "../models/Booking.js";
import User from "../models/user.js";

export const getPaymentSummary = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    const paidPayments = await Booking.countDocuments({
      paymentStatus: "PAID",
    });

    const unpaidPayments = await Booking.countDocuments({
      paymentStatus: "UNPAID",
    });

    const refundedPayments = await Booking.countDocuments({
      paymentStatus: "REFUNDED",
    });

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $ifNull: ["$amountPaid", "$price"],
            },
          },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        paidPayments,
        unpaidPayments,
        refundedPayments,
        totalRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load payment summary.",
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { paymentStatus = "" } = req.query;

    const filter = {};

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

    const payments = bookings.map((booking) => {
      const obj = booking.toObject();

      return {
        ...obj,
        artist: userMap[booking.artistUid] || null,
        customer: userMap[booking.customerUid] || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load payments.",
      error: error.message,
    });
  }
};

export const updatePaymentStatusByAccountant = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowedStatuses = ["UNPAID", "PAID", "REFUNDED"];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid payment status is required.",
      });
    }

    const updateData = {
      paymentStatus,
    };

    if (paymentStatus === "PAID") {
      updateData.paidAt = new Date();
    }

    if (paymentStatus === "UNPAID") {
      updateData.paidAt = null;
      updateData.amountPaid = null;
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
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