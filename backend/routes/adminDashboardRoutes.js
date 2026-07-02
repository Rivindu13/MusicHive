import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import {
  protectAdmin,
  authorizeAdminOnly,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/stats", protectAdmin, authorizeAdminOnly, getDashboardStats);

export default router;