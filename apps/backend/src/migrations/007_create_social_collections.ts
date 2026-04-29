/**
 * Migration: Create social collections — Notifications, Follows, Likes, Favorites
 * Description: Sets up the four social-graph collections with compound unique
 *              indexes to prevent duplicates, TTL expiry for notifications, and
 *              all query-path indexes derived from the Mongoose models.
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // -------------------------------------------------------------------------
    // Notifications
    // -------------------------------------------------------------------------
    const notificationsExists =
      (await db.listCollections({ name: 'notifications' }).toArray()).length > 0;

    if (!notificationsExists) {
      await db.createCollection('notifications', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['recipient', 'type', 'title', 'message', 'priority', 'category'],
            properties: {
              recipient: { bsonType: 'string' },
              type: {
                bsonType: 'string',
                enum: ['sale', 'purchase', 'bid', 'follow', 'like', 'comment', 'mention', 'system', 'price_alert'],
              },
              title:    { bsonType: 'string', maxLength: 200 },
              message:  { bsonType: 'string', maxLength: 1000 },
              isRead:   { bsonType: 'bool' },
              priority: { bsonType: 'string', enum: ['low', 'medium', 'high'] },
              category: { bsonType: 'string', enum: ['transaction', 'social', 'system', 'marketing'] },
            },
          },
        },
      });
      console.log("Collection 'notifications' created.");
    }

    const notifs = db.collection('notifications');
    await notifs.createIndex({ recipient: 1, isRead: 1, createdAt: -1 }, { name: 'recipient_isRead_createdAt_idx' });
    await notifs.createIndex({ recipient: 1, type: 1, createdAt: -1 }, { name: 'recipient_type_createdAt_idx' });
    await notifs.createIndex({ recipient: 1, priority: 1, createdAt: -1 }, { name: 'recipient_priority_createdAt_idx' });
    await notifs.createIndex({ type: 1, createdAt: -1 }, { name: 'type_createdAt_idx' });
    await notifs.createIndex({ category: 1, createdAt: -1 }, { name: 'category_createdAt_idx' });
    await notifs.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    // TTL index — removes expired notifications automatically
    await notifs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'notifications_ttl_idx' });
    console.log("Indexes for 'notifications' created.");

    // -------------------------------------------------------------------------
    // Follows
    // -------------------------------------------------------------------------
    const followsExists =
      (await db.listCollections({ name: 'follows' }).toArray()).length > 0;

    if (!followsExists) {
      await db.createCollection('follows', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['follower', 'following', 'status'],
            properties: {
              follower:  { bsonType: 'string' },
              following: { bsonType: 'string' },
              status:    { bsonType: 'string', enum: ['active', 'blocked', 'pending'] },
            },
          },
        },
      });
      console.log("Collection 'follows' created.");
    }

    const follows = db.collection('follows');
    // Unique compound index prevents duplicate follow relationships
    await follows.createIndex({ follower: 1, following: 1 }, { unique: true, name: 'follower_following_unique_idx' });
    await follows.createIndex({ following: 1, status: 1, createdAt: -1 }, { name: 'following_status_createdAt_idx' });
    await follows.createIndex({ follower: 1, status: 1, createdAt: -1 }, { name: 'follower_status_createdAt_idx' });
    await follows.createIndex({ status: 1, createdAt: -1 }, { name: 'status_createdAt_idx' });
    console.log("Indexes for 'follows' created.");

    // -------------------------------------------------------------------------
    // Likes
    // -------------------------------------------------------------------------
    const likesExists =
      (await db.listCollections({ name: 'likes' }).toArray()).length > 0;

    if (!likesExists) {
      await db.createCollection('likes', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['artwork', 'user'],
            properties: {
              artwork: { bsonType: 'objectId' },
              user:    { bsonType: 'string' },
            },
          },
        },
      });
      console.log("Collection 'likes' created.");
    }

    const likes = db.collection('likes');
    // Unique compound index prevents duplicate likes
    await likes.createIndex({ artwork: 1, user: 1 }, { unique: true, name: 'artwork_user_unique_idx' });
    await likes.createIndex({ user: 1, createdAt: -1 }, { name: 'user_createdAt_idx' });
    await likes.createIndex({ artwork: 1, createdAt: -1 }, { name: 'artwork_createdAt_idx' });
    await likes.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    console.log("Indexes for 'likes' created.");

    // -------------------------------------------------------------------------
    // Favorites
    // -------------------------------------------------------------------------
    const favoritesExists =
      (await db.listCollections({ name: 'favorites' }).toArray()).length > 0;

    if (!favoritesExists) {
      await db.createCollection('favorites', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['artwork', 'user'],
            properties: {
              artwork: { bsonType: 'objectId' },
              user:    { bsonType: 'string' },
            },
          },
        },
      });
      console.log("Collection 'favorites' created.");
    }

    const favorites = db.collection('favorites');
    // Unique compound index prevents duplicate favorites
    await favorites.createIndex({ artwork: 1, user: 1 }, { unique: true, name: 'artwork_user_unique_idx' });
    await favorites.createIndex({ user: 1, createdAt: -1 }, { name: 'user_createdAt_idx' });
    await favorites.createIndex({ artwork: 1, createdAt: -1 }, { name: 'artwork_createdAt_idx' });
    await favorites.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    console.log("Indexes for 'favorites' created.");
  },

  async down(connection: any) {
    const db = connection.db;

    for (const name of ['favorites', 'likes', 'follows', 'notifications']) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (exists) {
        await db.collection(name).drop();
        console.log(`Collection '${name}' dropped.`);
      }
    }
  },
};
