import express from "express";
import {
  getAllUsers,
  getSingleUser,
  blockUser,
  unblockUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import {
  protectAdmin,
  authorizeAdminOnly,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOnly, getAllUsers);
router.get("/:id", protectAdmin, authorizeAdminOnly, getSingleUser);
router.patch("/:id/block", protectAdmin, authorizeAdminOnly, blockUser);
router.patch("/:id/unblock", protectAdmin, authorizeAdminOnly, unblockUser);
router.delete("/:id", protectAdmin, authorizeAdminOnly, deleteUser);

export default router;