import express from "express";
import {
  getAllReviews,
  getSingleReview,
  deleteReview,
} from "../controllers/adminReviewController.js";
import {
  protectAdmin,
  authorizeAdminOrManager,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOrManager, getAllReviews);
router.get("/:id", protectAdmin, authorizeAdminOrManager, getSingleReview);
router.delete("/:id", protectAdmin, authorizeAdminOrManager, deleteReview);

export default router;