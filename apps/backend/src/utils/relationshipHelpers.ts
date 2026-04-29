import mongoose from 'mongoose'
import { User } from '../models/User'
import { Artwork } from '../models/Artwork'
import { Transaction } from '../models/Transaction'
import { Bid } from '../models/Bid'
import { Auction } from '../models/Auction'
import { Collection } from '../models/Collection'
import { Follow } from '../models/Follow'
import { Like } from '../models/Like'
import { Favorite } from '../models/Favorite'
import { Comment } from '../models/Comment'
import { Notification } from '../models/Notification'

/**
 * Relationship Management Utilities
 * 
 * This module provides helper functions for managing relationships
 * between entities in the Muse NFT Marketplace.
 */

/**
 * Get all artworks created by a user with pagination
 */
export async function getUserCreatedArtworks(
  userAddress: string,
  options: { skip?: number; limit?: number; sort?: any } = {}
) {
  const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options
  
  return await Artwork.find({ creator: userAddress })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all artworks owned by a user with pagination
 */
export async function getUserOwnedArtworks(
  userAddress: string,
  options: { skip?: number; limit?: number; sort?: any } = {}
) {
  const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options
  
  return await Artwork.find({ owner: userAddress })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all transactions involving a user
 */
export async function getUserTransactions(
  userAddress: string,
  options: { skip?: number; limit?: number; type?: string } = {}
) {
  const { skip = 0, limit = 20, type } = options
  
  const query: any = {
    $or: [
      { from: userAddress },
      { to: userAddress }
    ]
  }
  
  if (type) {
    query.type = type
  }
  
  return await Transaction.find(query)
    .populate('artwork', 'title imageUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all bids placed by a user
 */
export async function getUserBids(
  userAddress: string,
  options: { skip?: number; limit?: number; status?: string } = {}
) {
  const { skip = 0, limit = 20, status } = options
  
  const query: any = { bidder: userAddress }
  if (status) {
    query.status = status
  }
  
  return await Bid.find(query)
    .populate('artwork', 'title imageUrl price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all auctions created by a user
 */
export async function getUserAuctions(
  userAddress: string,
  options: { skip?: number; limit?: number; status?: string } = {}
) {
  const { skip = 0, limit = 20, status } = options
  
  const query: any = { seller: userAddress }
  if (status) {
    query.status = status
  }
  
  return await Auction.find(query)
    .populate('artwork', 'title imageUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all collections created by a user
 */
export async function getUserCollections(
  userAddress: string,
  options: { skip?: number; limit?: number; includePrivate?: boolean } = {}
) {
  const { skip = 0, limit = 20, includePrivate = false } = options
  
  const query: any = { creator: userAddress }
  if (!includePrivate) {
    query.isPublic = true
  }
  
  return await Collection.find(query)
    .populate('artworks', 'title imageUrl price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get user's favorites with artwork details
 */
export async function getUserFavorites(
  userAddress: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  return await Favorite.find({ user: userAddress })
    .populate('artwork', 'title imageUrl price creator owner')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get user's followers
 */
export async function getUserFollowers(
  userAddress: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  return await Follow.find({ following: userAddress, status: 'active' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get users that a user is following
 */
export async function getUserFollowing(
  userAddress: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  return await Follow.find({ follower: userAddress, status: 'active' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all comments by a user
 */
export async function getUserComments(
  userAddress: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  return await Comment.find({ author: userAddress, isDeleted: false })
    .populate('artwork', 'title imageUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userAddress: string,
  options: { skip?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const { skip = 0, limit = 20, unreadOnly = false } = options
  
  const query: any = { recipient: userAddress }
  if (unreadOnly) {
    query.isRead = false
  }
  
  return await Notification.find(query)
    .populate('data.artworkId', 'title imageUrl')
    .populate('data.transactionId', 'hash type')
    .populate('data.bidId', 'amount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

/**
 * Get complete artwork details with all relationships
 */
export async function getArtworkWithRelationships(artworkId: string) {
  const artwork = await Artwork.findById(artworkId).lean()
  
  if (!artwork) {
    return null
  }
  
  // Get related data
  const [transactions, bids, auction, comments, likes, favorites] = await Promise.all([
    Transaction.find({ artwork: artworkId }).sort({ createdAt: -1 }).lean(),
    Bid.find({ artwork: artworkId }).sort({ amount: -1 }).lean(),
    Auction.findOne({ artwork: artworkId }).lean(),
    Comment.find({ artwork: artworkId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean(),
    Like.countDocuments({ artwork: artworkId }),
    Favorite.countDocuments({ artwork: artworkId })
  ])
  
  return {
    ...artwork,
    transactions,
    bids,
    auction,
    comments,
    likesCount: likes,
    favoritesCount: favorites
  }
}

/**
 * Check if a user has liked an artwork
 */
export async function hasUserLikedArtwork(userAddress: string, artworkId: string): Promise<boolean> {
  const like = await Like.findOne({ user: userAddress, artwork: artworkId })
  return !!like
}

/**
 * Check if a user has favorited an artwork
 */
export async function hasUserFavoritedArtwork(userAddress: string, artworkId: string): Promise<boolean> {
  const favorite = await Favorite.findOne({ user: userAddress, artwork: artworkId })
  return !!favorite
}

/**
 * Check if a user follows another user
 */
export async function isUserFollowing(followerAddress: string, followingAddress: string): Promise<boolean> {
  const follow = await Follow.findOne({ 
    follower: followerAddress, 
    following: followingAddress, 
    status: 'active' 
  })
  return !!follow
}

/**
 * Toggle like on an artwork
 */
export async function toggleLike(userAddress: string, artworkId: string): Promise<{ liked: boolean }> {
  const existingLike = await Like.findOne({ user: userAddress, artwork: artworkId })
  
  if (existingLike) {
    await existingLike.deleteOne()
    return { liked: false }
  } else {
    await Like.create({ user: userAddress, artwork: artworkId })
    return { liked: true }
  }
}

/**
 * Toggle favorite on an artwork
 */
export async function toggleFavorite(userAddress: string, artworkId: string): Promise<{ favorited: boolean }> {
  const existingFavorite = await Favorite.findOne({ user: userAddress, artwork: artworkId })
  
  if (existingFavorite) {
    await existingFavorite.deleteOne()
    
    // Update user stats
    await User.findOneAndUpdate(
      { address: userAddress },
      { $inc: { 'stats.favorites': -1 } }
    )
    
    return { favorited: false }
  } else {
    await Favorite.create({ user: userAddress, artwork: artworkId })
    
    // Update user stats
    await User.findOneAndUpdate(
      { address: userAddress },
      { $inc: { 'stats.favorites': 1 } }
    )
    
    return { favorited: true }
  }
}

/**
 * Toggle follow on a user
 */
export async function toggleFollow(followerAddress: string, followingAddress: string): Promise<{ following: boolean }> {
  const existingFollow = await Follow.findOne({ 
    follower: followerAddress, 
    following: followingAddress 
  })
  
  if (existingFollow) {
    await existingFollow.deleteOne()
    
    // Update stats
    await Promise.all([
      User.findOneAndUpdate(
        { address: followerAddress },
        { $inc: { 'stats.following': -1 } }
      ),
      User.findOneAndUpdate(
        { address: followingAddress },
        { $inc: { 'stats.followers': -1 } }
      )
    ])
    
    return { following: false }
  } else {
    await Follow.create({ 
      follower: followerAddress, 
      following: followingAddress,
      status: 'active'
    })
    
    // Update stats
    await Promise.all([
      User.findOneAndUpdate(
        { address: followerAddress },
        { $inc: { 'stats.following': 1 } }
      ),
      User.findOneAndUpdate(
        { address: followingAddress },
        { $inc: { 'stats.followers': 1 } }
      )
    ])
    
    // Create notification
    await Notification.create({
      recipient: followingAddress,
      sender: followerAddress,
      type: 'follow',
      title: 'New Follower',
      message: `${followerAddress} started following you`,
      category: 'social',
      priority: 'low'
    })
    
    return { following: true }
  }
}

/**
 * Get artwork activity feed (transactions, bids, comments)
 */
export async function getArtworkActivity(
  artworkId: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  const [transactions, bids, comments] = await Promise.all([
    Transaction.find({ artwork: artworkId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Bid.find({ artwork: artworkId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Comment.find({ artwork: artworkId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
  ])
  
  // Combine and sort by date
  const activity = [
    ...transactions.map(t => ({ ...t, activityType: 'transaction' })),
    ...bids.map(b => ({ ...b, activityType: 'bid' })),
    ...comments.map(c => ({ ...c, activityType: 'comment' }))
  ]
  
  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(skip, skip + limit)
}

/**
 * Get user activity feed
 */
export async function getUserActivity(
  userAddress: string,
  options: { skip?: number; limit?: number } = {}
) {
  const { skip = 0, limit = 20 } = options
  
  const [transactions, bids, comments, likes, favorites] = await Promise.all([
    Transaction.find({ $or: [{ from: userAddress }, { to: userAddress }] })
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Bid.find({ bidder: userAddress })
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Comment.find({ author: userAddress, isDeleted: false })
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Like.find({ user: userAddress })
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Favorite.find({ user: userAddress })
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
  ])
  
  // Combine and sort by date
  const activity = [
    ...transactions.map(t => ({ ...t, activityType: 'transaction' })),
    ...bids.map(b => ({ ...b, activityType: 'bid' })),
    ...comments.map(c => ({ ...c, activityType: 'comment' })),
    ...likes.map(l => ({ ...l, activityType: 'like' })),
    ...favorites.map(f => ({ ...f, activityType: 'favorite' }))
  ]
  
  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(skip, skip + limit)
}

export default {
  getUserCreatedArtworks,
  getUserOwnedArtworks,
  getUserTransactions,
  getUserBids,
  getUserAuctions,
  getUserCollections,
  getUserFavorites,
  getUserFollowers,
  getUserFollowing,
  getUserComments,
  getUserNotifications,
  getArtworkWithRelationships,
  hasUserLikedArtwork,
  hasUserFavoritedArtwork,
  isUserFollowing,
  toggleLike,
  toggleFavorite,
  toggleFollow,
  getArtworkActivity,
  getUserActivity
}
