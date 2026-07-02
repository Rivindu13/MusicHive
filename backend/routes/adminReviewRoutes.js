import express from "express";
import {
  getAllReviews,
  getSingleReview,
  deleteReview,
} from "../controllers/adminReviewController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllReviews);
router.get("/:id", protectAdmin, getSingleReview);
router.delete("/:id", protectAdmin, deleteReview);

export default router;