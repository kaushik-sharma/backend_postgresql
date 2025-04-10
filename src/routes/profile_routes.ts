import { Router } from "express";

import {
  getUser,
  requestAccountDeletion,
  updateProfile,
  deleteProfileImage,
  validateUpdateProfileRequest,
} from "../controllers/profile_controller.js";
import { requireAuth } from "../middlewares/auth_middlewares.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";

const router = Router();

router.get("/user", requireAuth(), getUser);
router.patch(
  "/updateProfile",
  createSingleImageUploadMiddleware("profileImage"),
  requireAuth(),
  validateUpdateProfileRequest,
  updateProfile
);
router.delete("/deleteProfileImage", requireAuth(), deleteProfileImage);
router.delete(
  "/requestAccountDeletion",
  requireAuth(),
  requestAccountDeletion
);

export default router;
