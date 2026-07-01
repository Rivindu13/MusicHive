import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/stats", protectAdmin, getDashboardStats);

export default router;