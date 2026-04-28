/**
 * Migration: Add Relationship Support
 * Description: Validates referential integrity across collections, removes
 *              orphaned records, updates user statistics, and ensures all
 *              required indexes exist.
 */

import { User } from '@/models/User';
import { Artwork } from '@/models/Artwork';
import { Transaction } from '@/models/Transaction';
import { Bid } from '@/models/Bid';
import { Auction } from '@/models/Auction';
import { Collection } from '@/models/Collection';
import { Follow } from '@/models/Follow';
import { Like } from '@/models/Like';
import { Favorite } from '@/models/Favorite';
import { Comment } from '@/models/Comment';

export default {
  async up(_connection: any) {
    console.log('Starting relationship support migration...');

    // Step 1: Validate artwork references in transactions
    console.log('Validating artwork references in transactions...');
    const transactions = await Transaction.find({}).lean();
    const artworkIds = new Set(
      (await Artwork.find({}, '_id').lean()).map((a) => a._id.toString())
    );

    let invalidTransactions = 0;
    for (const transaction of transactions) {
      if (!artworkIds.has(transaction.artwork.toString())) {
        console.log(
          `Warning: Transaction ${transaction._id} references non-existent artwork ${transaction.artwork}`
        );
        invalidTransactions++;
      }
    }
    console.log(`Found ${invalidTransactions} transactions with invalid artwork references`);

    // Step 2: Validate artwork references in bids
    console.log('Validating artwork references in bids...');
    const bids = await Bid.find({}).lean();
    let invalidBids = 0;
    for (const bid of bids) {
      if (!artworkIds.has(bid.artwork.toString())) {
        console.log(`Warning: Bid ${bid._id} references non-existent artwork ${bid.artwork}`);
        invalidBids++;
      }
    }
    console.log(`Found ${invalidBids} bids with invalid artwork references`);

    // Step 3: Validate artwork references in auctions
    console.log('Validating artwork references in auctions...');
    const auctions = await Auction.find({}).lean();
    let invalidAuctions = 0;
    for (const auction of auctions) {
      if (!artworkIds.has(auction.artwork.toString())) {
        console.log(
          `Warning: Auction ${auction._id} references non-existent artwork ${auction.artwork}`
        );
        invalidAuctions++;
      }
    }
    console.log(`Found ${invalidAuctions} auctions with invalid artwork references`);

    // Step 4: Clean up artworks array in collections
    console.log('Cleaning up collection artwork references...');
    const collections = await Collection.find({});
    let cleanedCollections = 0;
    for (const collection of collections) {
      const originalCount = collection.artworks.length;
      collection.artworks = collection.artworks.filter((artworkId) =>
        artworkIds.has(artworkId.toString())
      );
      if (collection.artworks.length !== originalCount) {
        collection.stats.totalArtworks = collection.artworks.length;
        await collection.save();
        cleanedCollections++;
        console.log(
          `Cleaned collection ${collection._id}: removed ${
            originalCount - collection.artworks.length
          } invalid references`
        );
      }
    }
    console.log(`Cleaned ${cleanedCollections} collections`);

    // Step 5: Update user statistics
    console.log('Updating user statistics...');
    const users = await User.find({});
    let updatedUsers = 0;

    for (const user of users) {
      const { address } = user;

      const createdCount = await Artwork.countDocuments({ creator: address });
      const collectedCount = await Artwork.countDocuments({ owner: address });
      const favoritesCount = await Favorite.countDocuments({ user: address });
      const followersCount = await Follow.countDocuments({ following: address, status: 'active' });
      const followingCount = await Follow.countDocuments({ follower: address, status: 'active' });

      if (
        user.stats?.created !== createdCount ||
        user.stats?.collected !== collectedCount ||
        user.stats?.favorites !== favoritesCount ||
        user.stats?.followers !== followersCount ||
        user.stats?.following !== followingCount
      ) {
        if (!user.stats) user.stats = {};
        user.stats.created = createdCount;
        user.stats.collected = collectedCount;
        user.stats.favorites = favoritesCount;
        user.stats.followers = followersCount;
        user.stats.following = followingCount;
        await user.save();
        updatedUsers++;
      }
    }
    console.log(`Updated statistics for ${updatedUsers} users`);

    // Step 6: Validate bid references in auctions
    console.log('Validating bid references in auctions...');
    const bidIds = new Set(
      (await Bid.find({}, '_id').lean()).map((b) => b._id.toString())
    );
    let cleanedAuctions = 0;

    for (const auction of await Auction.find({})) {
      const originalCount = auction.bids.length;
      auction.bids = auction.bids.filter((bidId) => bidIds.has(bidId.toString()));

      if (auction.bids.length !== originalCount) {
        await auction.save();
        cleanedAuctions++;
        console.log(
          `Cleaned auction ${auction._id}: removed ${
            originalCount - auction.bids.length
          } invalid bid references`
        );
      }
    }
    console.log(`Cleaned ${cleanedAuctions} auctions`);

    // Step 7: Ensure all indexes exist
    console.log('Ensuring all indexes are created...');
    await User.createIndexes();
    await Artwork.createIndexes();
    await Transaction.createIndexes();
    await Bid.createIndexes();
    await Auction.createIndexes();
    await Collection.createIndexes();
    await Comment.createIndexes();
    await Like.createIndexes();
    await Favorite.createIndexes();
    await Follow.createIndexes();
    console.log('All indexes created successfully');

    console.log('Relationship support migration completed successfully!');
  },

  async down(_connection: any) {
    // This migration only validates and cleans existing data — nothing to roll back.
    console.log('Rollback for 003_add_relationship_support is a no-op (data-only migration).');
  },
};
