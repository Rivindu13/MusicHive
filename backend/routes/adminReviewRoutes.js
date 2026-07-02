import express from "express";
import {
  getAllReviews,
  getSingleReview,
  deleteReview,
} from "../controllers/adminReviewController.js";
import {
  protectAdmin,
  authorizeAdminOnly,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOnly, getAllReviews);
router.get("/:id", protectAdmin, authorizeAdminOnly, getSingleReview);
router.delete("/:id", protectAdmin, authorizeAdminOnly, deleteReview);

export default router;