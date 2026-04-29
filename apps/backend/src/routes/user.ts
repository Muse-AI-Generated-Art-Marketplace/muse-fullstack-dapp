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
import {
  userProfileCache,
  userActivityCache,
  leaderboardCache,
  invalidateUserCache,
} from "@/middleware/cacheMiddleware";

const router = Router();

/**
 * @openapi
 * /api/users/{address}:
 *   get:
 *     summary: Get user profile by wallet address
 *     description: Retrieve user profile information by Stellar wallet address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:address", optionalAuthenticate, getProfile);

/**
 * @openapi
 * /api/users/id/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Retrieve user profile information by internal ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/id/:id", getProfileById);

/**
 * @openapi
 * /api/users/{address}:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Can only update own profile
 */
router.put("/:address", authenticate, updateProfile);

/**
 * @openapi
 * /api/users/{address}:
 *   delete:
 *     summary: Delete user profile
 *     description: Delete the authenticated user's profile and all associated data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address
 *     responses:
 *       204:
 *         description: Profile deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Can only delete own profile
 */
router.delete("/:address", authenticate, deleteProfile);

/**
 * @openapi
 * /api/users/{address}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update the authenticated user's preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               publicProfile:
 *                 type: boolean
 *               defaultStyle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Authentication required
 */
router.put("/:address/preferences", authenticate, updatePreferences);

/**
 * @openapi
 * /api/users/{address}/activity:
 *   get:
 *     summary: Get user activity
 *     description: Retrieve user's recent activity history
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activity returned successfully
 */
router.get("/:address/activity", getUserActivity);

/**
 * @openapi
 * /api/users/{address}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve user's statistics (artworks created, sold, earnings)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User statistics returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artworksCreated:
 *                   type: integer
 *                 artworksSold:
 *                   type: integer
 *                 totalEarnings:
 *                   type: number
 */
router.get("/:address/stats", getUserStats);

/**
 * @openapi
 * /api/users/search/query:
 *   get:
 *     summary: Search users
 *     description: Search for users by name, address, or other criteria
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results returned
 */
router.get("/search/query", searchUsers);

/**
 * @openapi
 * /api/users/leaderboard/list:
 *   get:
 *     summary: Get user leaderboard
 *     description: Retrieve leaderboard of top users by various metrics
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [artworks, earnings, followers]
 *           default: artworks
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, all]
 *           default: all
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard returned successfully
 */
router.get("/leaderboard/list", getLeaderboard);

export default router;
