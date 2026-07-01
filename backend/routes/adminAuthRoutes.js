import express from "express";
import { loginAdmin, getAdminProfile } from "../controllers/adminAuthController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/profile", protectAdmin, getAdminProfile);

export default router;