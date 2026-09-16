import User from "../models/user.js";
import Subscription from "../models/Subscription.js";

const USER_ROLES = ["artist", "band", "organizer"];

export const getAllUsers = async (req, res) => {
  try {
    const { search = "", subscriptionStatus = "", status = "" } = req.query;

    const filter = { role: "organizer" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { uid: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    const subscriptions = await Subscription.find({
      organizerUid: { $in: users.map((user) => user.uid) },
    })
      .select("organizerUid plan status expiresAt")
      .lean();
    const now = new Date();
    const subscriptionMap = new Map(
      subscriptions.map((subscription) => [
        subscription.organizerUid,
        subscription,
      ])
    );

    const data = users.map((user) => {
      const subscription = subscriptionMap.get(user.uid);
      const isSubscribed =
        subscription?.status === "ACTIVE" &&
        subscription.expiresAt &&
        new Date(subscription.expiresAt) > now;

      return {
        ...user.toObject(),
        subscription: subscription || null,
        subscriptionStatus: isSubscribed ? "SUBSCRIBED" : "NOT_SUBSCRIBED",
      };
    });

    const filteredData = subscriptionStatus
      ? data.filter((user) => user.subscriptionStatus === subscriptionStatus)
      : data;

    return res.status(200).json({
      success: true,
      count: filteredData.length,
      data: filteredData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
      error: error.message,
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load user.",
      error: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "A valid user role is required.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: user.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user role.",
      error: error.message,
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: true,
        status: "blocked",
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to block user.",
      error: error.message,
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBlocked: false,
        status: "active",
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to unblock user.",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};