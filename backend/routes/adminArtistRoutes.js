import express from "express";
import {
  getAllArtists,
  getSingleArtist,
  blockArtist,
  unblockArtist,
  deleteArtist,
} from "../controllers/adminArtistController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllArtists);
router.get("/:id", protectAdmin, getSingleArtist);
router.patch("/:id/block", protectAdmin, blockArtist);
router.patch("/:id/unblock", protectAdmin, unblockArtist);
router.delete("/:id", protectAdmin, deleteArtist);

export default router;