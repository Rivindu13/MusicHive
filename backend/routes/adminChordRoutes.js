import express from "express";
import {
  getAllChords,
  getSingleChord,
  deleteChord,
} from "../controllers/adminChordController.js";
import {
  protectAdmin,
  authorizeAdminOrManager,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOrManager, getAllChords);
router.get("/:id", protectAdmin, authorizeAdminOrManager, getSingleChord);
router.delete("/:id", protectAdmin, authorizeAdminOrManager, deleteChord);

export default router;