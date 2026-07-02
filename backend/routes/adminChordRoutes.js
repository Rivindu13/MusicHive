import express from "express";
import {
  getAllChords,
  getSingleChord,
  deleteChord,
} from "../controllers/adminChordController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllChords);
router.get("/:id", protectAdmin, getSingleChord);
router.delete("/:id", protectAdmin, deleteChord);

export default router;