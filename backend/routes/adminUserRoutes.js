import express from "express";
import {
  getAllUsers,
  getSingleUser,
  blockUser,
  unblockUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllUsers);
router.get("/:id", protectAdmin, getSingleUser);
router.patch("/:id/block", protectAdmin, blockUser);
router.patch("/:id/unblock", protectAdmin, unblockUser);
router.delete("/:id", protectAdmin, deleteUser);

export default router;