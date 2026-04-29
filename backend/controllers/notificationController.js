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

export const getAndClearNotifications = async (req, res) => {
  try {
    const { uid } = req.params;

    const notifications = await Notification.find({ recipientUid: uid }).sort({
      createdAt: -1,
    });

    await Notification.deleteMany({ recipientUid: uid });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotificationCount = async (req, res) => {
  try {
    const { uid } = req.params;

    const count = await Notification.countDocuments({ recipientUid: uid });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};