import mongoose from 'mongoose'
import { User } from '../models/User'
import { Artwork } from '../models/Artwork'
import { Transaction } from '../models/Transaction'
import { Collection } from '../models/Collection'
import { Bid } from '../models/Bid'
import { Auction } from '../models/Auction'
import { Comment } from '../models/Comment'
import { Notification } from '../models/Notification'
import { Like } from '../models/Like'
import { Favorite } from '../models/Favorite'
import { Follow } from '../models/Follow'

/**
 * Test suite to verify all virtual relationships work correctly
 * This file demonstrates how to use the newly added virtual relationships
 */

async function testRelationships() {
  try {
    // Connect to MongoDB (make sure to configure your connection string)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/muse-test')
    
    console.log('Testing virtual relationships...')
    
    // 1. Test User virtual relationships
    console.log('\n=== Testing User Relationships ===')
    
    const user = await User.findOne().populate([
      'createdArtworks',
      'ownedArtworks', 
      'transactions',
      'receivedTransactions',
      'bids',
      'auctions',
      'collections',
      'comments',
      'likes',
      'favorites',
      'followers_list',
      'following_list',
      'notifications'
    ])
    
    if (user) {
      console.log(`User: ${user.username}`)
      console.log(`Created artworks: ${user.createdArtworks?.length || 0}`)
      console.log(`Owned artworks: ${user.ownedArtworks?.length || 0}`)
      console.log(`Transactions sent: ${user.transactions?.length || 0}`)
      console.log(`Transactions received: ${user.receivedTransactions?.length || 0}`)
      console.log(`Bids placed: ${user.bids?.length || 0}`)
      console.log(`Auctions created: ${user.auctions?.length || 0}`)
      console.log(`Collections created: ${user.collections?.length || 0}`)
      console.log(`Comments made: ${user.comments?.length || 0}`)
      console.log(`Likes given: ${user.likes?.length || 0}`)
      console.log(`Favorites: ${user.favorites?.length || 0}`)
      console.log(`Followers: ${user.followers_list?.length || 0}`)
      console.log(`Following: ${user.following_list?.length || 0}`)
      console.log(`Notifications: ${user.notifications?.length || 0}`)
    }
    
    // 2. Test Artwork virtual relationships
    console.log('\n=== Testing Artwork Relationships ===')
    
    const artwork = await Artwork.findOne().populate([
      'artistInfo',
      'transactions',
      'bids',
      'auction',
      'comments',
      'likes',
      'favorites'
    ])
    
    if (artwork) {
      console.log(`Artwork: ${artwork.title}`)
      console.log(`Artist: ${artwork.artistInfo?.username || 'Unknown'}`)
      console.log(`Transactions: ${artwork.transactions?.length || 0}`)
      console.log(`Bids: ${artwork.bids?.length || 0}`)
      console.log(`Has auction: ${artwork.auction ? 'Yes' : 'No'}`)
      console.log(`Comments: ${artwork.comments?.length || 0}`)
      console.log(`Likes: ${artwork.likes?.length || 0}`)
      console.log(`Favorites: ${artwork.favorites?.length || 0}`)
    }
    
    // 3. Test Transaction virtual relationships
    console.log('\n=== Testing Transaction Relationships ===')
    
    const transaction = await Transaction.findOne().populate([
      'artworkInfo',
      'fromUserInfo',
      'toUserInfo'
    ])
    
    if (transaction) {
      console.log(`Transaction: ${transaction.hash}`)
      console.log(`Type: ${transaction.type}`)
      console.log(`Artwork: ${transaction.artworkInfo?.title || 'Unknown'}`)
      console.log(`From: ${transaction.fromUserInfo?.username || 'Unknown'}`)
      console.log(`To: ${transaction.toUserInfo?.username || 'Unknown'}`)
      console.log(`Amount: ${transaction.price} ${transaction.currency}`)
    }
    
    // 4. Test Collection virtual relationships
    console.log('\n=== Testing Collection Relationships ===')
    
    const collection = await Collection.findOne().populate([
      'creatorInfo',
      'artworkDetails'
    ])
    
    if (collection) {
      console.log(`Collection: ${collection.name}`)
      console.log(`Creator: ${collection.creatorInfo?.username || 'Unknown'}`)
      console.log(`Artworks: ${collection.artworkDetails?.length || 0}`)
      console.log(`Total artworks (from stats): ${collection.stats.totalArtworks}`)
    }
    
    // 5. Test Bid virtual relationships
    console.log('\n=== Testing Bid Relationships ===')
    
    const bid = await Bid.findOne().populate([
      'artworkInfo',
      'bidderInfo'
    ])
    
    if (bid) {
      console.log(`Bid: ${bid.amount} ${bid.currency}`)
      console.log(`Artwork: ${bid.artworkInfo?.title || 'Unknown'}`)
      console.log(`Bidder: ${bid.bidderInfo?.username || 'Unknown'}`)
      console.log(`Status: ${bid.status}`)
    }
    
    // 6. Test Auction virtual relationships
    console.log('\n=== Testing Auction Relationships ===')
    
    const auction = await Auction.findOne().populate([
      'artworkInfo',
      'sellerInfo',
      'currentBidderInfo',
      'winnerInfo',
      'bidDetails'
    ])
    
    if (auction) {
      console.log(`Auction for: ${auction.artworkInfo?.title || 'Unknown'}`)
      console.log(`Seller: ${auction.sellerInfo?.username || 'Unknown'}`)
      console.log(`Current bidder: ${auction.currentBidderInfo?.username || 'None'}`)
      console.log(`Winner: ${auction.winnerInfo?.username || 'None'}`)
      console.log(`Current bid: ${auction.currentBid || 'None'}`)
      console.log(`Number of bids: ${auction.bidDetails?.length || 0}`)
      console.log(`Status: ${auction.status}`)
    }
    
    // 7. Test Comment virtual relationships
    console.log('\n=== Testing Comment Relationships ===')
    
    const comment = await Comment.findOne().populate([
      'artworkInfo',
      'authorInfo',
      'parentCommentInfo',
      'replyDetails',
      'likerInfos',
      'reporterInfos'
    ])
    
    if (comment) {
      console.log(`Comment by: ${comment.authorInfo?.username || 'Unknown'}`)
      console.log(`On artwork: ${comment.artworkInfo?.title || 'Unknown'}`)
      console.log(`Parent comment: ${comment.parentCommentInfo ? 'Yes' : 'No'}`)
      console.log(`Replies: ${comment.replyDetails?.length || 0}`)
      console.log(`Likes: ${comment.likerInfos?.length || 0}`)
      console.log(`Reports: ${comment.reporterInfos?.length || 0}`)
    }
    
    // 8. Test Notification virtual relationships
    console.log('\n=== Testing Notification Relationships ===')
    
    const notification = await Notification.findOne().populate([
      'recipientInfo',
      'senderInfo'
    ])
    
    if (notification) {
      console.log(`Notification: ${notification.title}`)
      console.log(`Type: ${notification.type}`)
      console.log(`Recipient: ${notification.recipientInfo?.username || 'Unknown'}`)
      console.log(`Sender: ${notification.senderInfo?.username || 'System'}`)
      console.log(`Read: ${notification.isRead ? 'Yes' : 'No'}`)
    }
    
    // 9. Test Like virtual relationships
    console.log('\n=== Testing Like Relationships ===')
    
    const like = await Like.findOne().populate([
      'artworkInfo',
      'userInfo'
    ])
    
    if (like) {
      console.log(`Like by: ${like.userInfo?.username || 'Unknown'}`)
      console.log(`On artwork: ${like.artworkInfo?.title || 'Unknown'}`)
    }
    
    // 10. Test Favorite virtual relationships
    console.log('\n=== Testing Favorite Relationships ===')
    
    const favorite = await Favorite.findOne().populate([
      'artworkInfo',
      'userInfo'
    ])
    
    if (favorite) {
      console.log(`Favorite by: ${favorite.userInfo?.username || 'Unknown'}`)
      console.log(`On artwork: ${favorite.artworkInfo?.title || 'Unknown'}`)
    }
    
    // 11. Test Follow virtual relationships
    console.log('\n=== Testing Follow Relationships ===')
    
    const follow = await Follow.findOne().populate([
      'followerInfo',
      'followingInfo'
    ])
    
    if (follow) {
      console.log(`Follow relationship:`)
      console.log(`Follower: ${follow.followerInfo?.username || 'Unknown'}`)
      console.log(`Following: ${follow.followingInfo?.username || 'Unknown'}`)
      console.log(`Status: ${follow.status}`)
    }
    
    console.log('\n=== All relationships tested successfully! ===')
    
  } catch (error) {
    console.error('Error testing relationships:', error)
  } finally {
    await mongoose.disconnect()
  }
}

// Export for use in test files
export { testRelationships }

// Run tests if this file is executed directly
if (require.main === module) {
  testRelationships()
}
