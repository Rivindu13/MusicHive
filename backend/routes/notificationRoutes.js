import express from "express";
import {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/:uid", requireAuth, getNotifications);
router.get("/:uid/count", requireAuth, getNotificationCount);
router.patch("/:id/read", requireAuth, markNotificationRead);
router.patch("/:uid/read-all", requireAuth, markAllNotificationsRead);

export default router;