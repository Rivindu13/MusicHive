import express from "express";
import {
  getAndClearNotifications,
  getNotificationCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:uid", getAndClearNotifications);
router.get("/:uid/count", getNotificationCount);

export default router;