import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientUid,
  senderUid = "",
  type,
  title,
  message,
  link = "",
}) => {
  if (!recipientUid || !type || !title || !message) return;

  await Notification.create({
    recipientUid,
    senderUid,
    type,
    title,
    message,
    link,
  });
};

export const getNotifications = async (req, res) => {
  try {
    const { uid } = req.params;

    if (req.user.uid !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own notifications",
      });
    }

    const notifications = await Notification.find({ recipientUid: uid }).sort({
      createdAt: -1,
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotificationCount = async (req, res) => {
  try {
    const { uid } = req.params;

    if (req.user.uid !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own notifications",
      });
    }

    const count = await Notification.countDocuments({
      recipientUid: uid,
      read: false,
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientUid: req.user.uid },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    return res.json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientUid: req.user.uid, read: false },
      { $set: { read: true } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};