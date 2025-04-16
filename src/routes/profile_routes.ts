import { Router } from "express";

import { requireAuth } from "../middlewares/auth_middlewares.js";
import ProfileController from "../controllers/profile_controller.js";
import { createSingleImageUploadMiddleware } from "../middlewares/file_upload_middlewares.js";

const router = Router();

router.get("/user", requireAuth(), ProfileController.getUser);
router.get("/user/:userId", requireAuth(), ProfileController.getPublicUser);
router.patch(
  "/updateProfile",
  createSingleImageUploadMiddleware("profileImage"),
  requireAuth(),
  ProfileController.validateUpdateProfileRequest,
  ProfileController.updateProfile
);
router.delete(
  "/deleteProfileImage",
  requireAuth(),
  ProfileController.deleteProfileImage
);
router.delete(
  "/requestAccountDeletion",
  requireAuth(),
  ProfileController.requestAccountDeletion
);

export default router;
