import express from "express";
import {
  getAllArtists,
  getSingleArtist,
  blockArtist,
  unblockArtist,
  deleteArtist,
} from "../controllers/adminArtistController.js";
import {
  protectAdmin,
  authorizeAdminOnly,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOnly, getAllArtists);
router.get("/:id", protectAdmin, authorizeAdminOnly, getSingleArtist);
router.patch("/:id/block", protectAdmin, authorizeAdminOnly, blockArtist);
router.patch("/:id/unblock", protectAdmin, authorizeAdminOnly, unblockArtist);
router.delete("/:id", protectAdmin, authorizeAdminOnly, deleteArtist);

export default router;