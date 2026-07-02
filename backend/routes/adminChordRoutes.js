import express from "express";
import {
  getAllChords,
  getSingleChord,
  deleteChord,
} from "../controllers/adminChordController.js";
import {
  protectAdmin,
  authorizeAdminOnly,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOnly, getAllChords);
router.get("/:id", protectAdmin, authorizeAdminOnly, getSingleChord);
router.delete("/:id", protectAdmin, authorizeAdminOnly, deleteChord);

export default router;