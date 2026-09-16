import express from "express";
import { getAllReports, updateReportStatus } from "../controllers/adminReportController.js";
import { protectAdmin, authorizeAdminOrManager } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();
router.get("/", protectAdmin, authorizeAdminOrManager, getAllReports);
router.patch("/:id/status", protectAdmin, authorizeAdminOrManager, updateReportStatus);
export default router;
