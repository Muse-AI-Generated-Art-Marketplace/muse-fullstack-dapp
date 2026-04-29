import { User, UserDocument, ArtworkDocument } from '@/models'
import { UserProfileUpdateRequest } from '@/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('UserService')

export interface UserProfileOptions {
  includeArtworks?: boolean
  includeOwnedArtworks?: boolean
  includeStats?: boolean
  artworkLimit?: number
}

class UserService {
  /**
   * Get user profile with optimized queries to prevent N+1 problems
   */
  async getUserProfile(
    userId: string, 
    options: UserProfileOptions = {}
  ): Promise<any> {
    const { 
      includeArtworks = false, 
      includeOwnedArtworks = false, 
      includeStats = true,
      artworkLimit = 10 
    } = options

    try {
      // Get user base profile
      const user = await User.findById(userId)
        .lean()
        .exec()

      if (!user) {
        throw new Error('User not found')
      }

      const result: any = { ...user }

      // If stats are requested, ensure they're included
      if (includeStats) {
        result.stats = user.stats || this.getDefaultStats()
      }

      // Handle artwork queries efficiently to prevent N+1
      if (includeArtworks || includeOwnedArtworks) {
        const [createdArtworks, ownedArtworks] = await Promise.all([
          includeArtworks ? this.getUserArtworks(userId, 'creator', artworkLimit) : Promise.resolve([]),
          includeOwnedArtworks ? this.getUserArtworks(userId, 'owner', artworkLimit) : Promise.resolve([])
        ])

        if (includeArtworks) {
          result.createdArtworks = createdArtworks
        }
        if (includeOwnedArtworks) {
          result.ownedArtworks = ownedArtworks
        }
      }

      return result
    } catch (error) {
      logger.error(`Error fetching user profile for ${userId}:`, error)
      throw error
    }
  }

  /**
   * Get user by public key with optimized queries
   */
  async getUserByPublicKey(
    publicKey: string, 
    options: UserProfileOptions = {}
  ): Promise<any> {
    try {
      const user = await User.findOne({ publicKey })
        .lean()
        .exec()

      if (!user) {
        throw new Error('User not found')
      }

      return await this.getUserProfile(user._id.toString(), options)
    } catch (error) {
      logger.error(`Error fetching user by public key ${publicKey}:`, error)
      throw error
    }
  }

  /**
   * Update user profile with proper validation
   */
  async updateUserProfile(
    userId: string, 
    updates: UserProfileUpdateRequest
  ): Promise<any> {
    try {
      // Validate updates
      const validatedUpdates = this.validateProfileUpdates(updates)

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: validatedUpdates },
        { new: true, runValidators: true }
      )
        .lean()
        .exec()

      if (!updatedUser) {
        throw new Error('User not found')
      }

      return updatedUser
    } catch (error) {
      logger.error(`Error updating user profile for ${userId}:`, error)
      throw error
    }
  }

  /**
   * Get user artworks with proper population to prevent N+1
   */
  private async getUserArtworks(
    userId: string, 
    field: 'creator' | 'owner', 
    limit: number = 10
  ): Promise<any[]> {
    try {
      const query = field === 'creator' 
        ? { creator: userId, isListed: true }
        : { owner: userId }

      return await ArtworkDocument.find(query)
        .populate([
          {
            path: 'creator',
            select: 'publicKey username avatar isVerified',
            model: 'User'
          },
          {
            path: 'owner',
            select: 'publicKey username avatar isVerified',
            model: 'User'
          }
        ])
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec()
    } catch (error) {
      logger.error(`Error fetching ${field} artworks for user ${userId}:`, error)
      return []
    }
  }

  /**
   * Get multiple user profiles efficiently (batch loading)
   */
  async getUserProfiles(userIds: string[]): Promise<any[]> {
    try {
      const users = await User.find({ _id: { $in: userIds } })
        .lean()
        .exec()

      return users
    } catch (error) {
      logger.error('Error fetching multiple user profiles:', error)
      throw new Error('Failed to fetch user profiles')
    }
  }

  /**
   * Search users with proper indexing
   */
  async searchUsers(
    searchTerm: string,
    options: { page?: string; limit?: string; isVerified?: boolean } = {}
  ): Promise<any> {
    const { page = '1', limit = '20', isVerified } = options
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const query: any = {}

    if (searchTerm) {
      // Search by username or public key
      query.$or = [
        { username: { $regex: searchTerm, $options: 'i' } },
        { publicKey: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified
    }

    try {
      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ 'stats.followers': -1, createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        User.countDocuments(query).exec()
      ])

      const totalPages = Math.ceil(total / limitNum)

      return {
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    } catch (error) {
      logger.error(`Error searching users with term "${searchTerm}":`, error)
      throw new Error('Failed to search users')
    }
  }

  /**
   * Get user statistics with optimized queries
   */
  async getUserStatistics(userId: string): Promise<any> {
    try {
      // Get user base stats
      const user = await User.findById(userId)
        .select('stats')
        .lean()
        .exec()

      if (!user) {
        throw new Error('User not found')
      }

      // Get additional statistics from artwork collections
      const [createdCount, ownedCount, listedCount] = await Promise.all([
        ArtworkDocument.countDocuments({ creator: userId }).exec(),
        ArtworkDocument.countDocuments({ owner: userId }).exec(),
        ArtworkDocument.countDocuments({ creator: userId, isListed: true }).exec()
      ])

      return {
        ...user.stats,
        artworksCreated: createdCount,
        artworksOwned: ownedCount,
        artworksListed: listedCount
      }
    } catch (error) {
      logger.error(`Error fetching user statistics for ${userId}:`, error)
      throw error
    }
  }

  /**
   * Follow/unfollow user with proper validation
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    try {
      // Check if both users exist
      const [follower, following] = await Promise.all([
        User.findById(followerId).exec(),
        User.findById(followingId).exec()
      ])

      if (!follower || !following) {
        throw new Error('User not found')
      }

      // Update follower and following counts
      await Promise.all([
        User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.following': 1 }
        }).exec(),
        User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followers': 1 }
        }).exec()
      ])

    } catch (error) {
      logger.error(`Error following user ${followingId} by ${followerId}:`, error)
      throw error
    }
  }

  /**
   * Unfollow user with proper validation
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Update follower and following counts
      await Promise.all([
        User.findByIdAndUpdate(followerId, {
          $inc: { 'stats.following': -1 }
        }).exec(),
        User.findByIdAndUpdate(followingId, {
          $inc: { 'stats.followers': -1 }
        }).exec()
      ])

    } catch (error) {
      logger.error(`Error unfollowing user ${followingId} by ${followerId}:`, error)
      throw error
    }
  }

  /**
   * Create user profile with proper validation
   */
  async createUserProfile(userData: {
    publicKey: string
    username?: string
    email?: string
  }): Promise<any> {
    try {
      const user = new User({
        ...userData,
        stats: this.getDefaultStats(),
        preferences: this.getDefaultPreferences()
      })

      const savedUser = await user.save()
      return savedUser.toJSON()
    } catch (error) {
      logger.error('Error creating user profile:', error)
      throw error
    }
  }

  /**
   * Validate profile updates
   */
  private validateProfileUpdates(updates: UserProfileUpdateRequest): UserProfileUpdateRequest {
    const validated: any = {}

    if (updates.username !== undefined) {
      if (updates.username && updates.username.length < 3) {
        throw new Error('Username must be at least 3 characters long')
      }
      validated.username = updates.username?.toLowerCase()
    }

    if (updates.email !== undefined) {
      if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        throw new Error('Invalid email format')
      }
      validated.email = updates.email?.toLowerCase()
    }

    if (updates.bio !== undefined) {
      if (updates.bio && updates.bio.length > 500) {
        throw new Error('Bio must be less than 500 characters')
      }
      validated.bio = updates.bio?.trim()
    }

    if (updates.website !== undefined) {
      if (updates.website && !/^https?:\/\/.+/.test(updates.website)) {
        throw new Error('Website must be a valid URL')
      }
      validated.website = updates.website?.trim()
    }

    if (updates.twitter !== undefined) {
      if (updates.twitter && !/^[a-zA-Z0-9_]{1,15}$/.test(updates.twitter)) {
        throw new Error('Invalid Twitter username')
      }
      validated.twitter = updates.twitter?.trim()
    }

    if (updates.discord !== undefined) {
      if (updates.discord && updates.discord.length > 50) {
        throw new Error('Discord username must be less than 50 characters')
      }
      validated.discord = updates.discord?.trim()
    }

    if (updates.avatar !== undefined) {
      validated.avatar = updates.avatar?.trim()
    }

    if (updates.banner !== undefined) {
      validated.banner = updates.banner?.trim()
    }

    return validated
  }

  /**
   * Get default user stats
   */
  private getDefaultStats() {
    return {
      artworksCreated: 0,
      artworksOwned: 0,
      totalSales: '0',
      totalPurchases: '0',
      followers: 0,
      following: 0
    }
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences() {
    return {
      notifications: {
        email: true,
        push: true,
        sales: true,
        purchases: true,
        follows: true,
        priceAlerts: true
      },
      privacy: {
        showPublicProfile: true,
        showHoldings: true,
        showActivity: true,
        allowMessages: true
      },
      display: {
        theme: 'dark',
        language: 'en',
        currency: 'ETH',
        timezone: 'UTC'
      }
    }
  }
}

export const userService = new UserService()
