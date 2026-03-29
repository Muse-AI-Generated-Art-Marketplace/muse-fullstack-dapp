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
import { standardLimiter } from "@/middleware/rateLimitMiddleware";

const router = Router();

router.get("/:address", optionalAuthenticate, getProfile);
router.get("/id/:id", getProfileById);
router.put("/:address", authenticate, standardLimiter, updateProfile);
router.delete("/:address", authenticate, deleteProfile);
router.put("/:address/preferences", authenticate, updatePreferences);
router.get("/:address/activity", getUserActivity);
router.get("/:address/stats", getUserStats);
router.get("/search/query", searchUsers);
router.get("/leaderboard/list", getLeaderboard);

export default router;
