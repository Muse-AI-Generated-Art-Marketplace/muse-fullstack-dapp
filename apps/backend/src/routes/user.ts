import { Router } from "express";
import {
  getProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  updatePreferences,
  getUserActivity,
  getUserStats,
  searchUsers,
  getLeaderboard,
} from "@/controllers/userController";
import {
  authenticate,
  optionalAuthenticate,
} from "@/middleware/authMiddleware";
import { validate } from "@/middleware/validate";
import {
  getProfileSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  userActivitySchema,
  searchUsersSchema,
  leaderboardSchema
} from "@/schemas";

const router = Router();

router.get("/:address", optionalAuthenticate, validate(getProfileSchema), getProfile);
router.get("/id/:id", getProfileById);
router.put("/:address", authenticate, validate(updateProfileSchema), updateProfile);
router.delete("/:address", authenticate, validate(getProfileSchema), deleteProfile);
router.put("/:address/preferences", authenticate, validate(updatePreferencesSchema), updatePreferences);
router.get("/:address/activity", validate(userActivitySchema), getUserActivity);
router.get("/:address/stats", validate(getProfileSchema), getUserStats);
router.get("/search/query", validate(searchUsersSchema), searchUsers);
router.get("/leaderboard/list", validate(leaderboardSchema), getLeaderboard);

export default router;
