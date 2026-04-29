/**
 * Migration: Create Collections and Comments collections
 * Description: Sets up the collections and comments collections with schema
 *              validation, text search indexes, and hierarchical comment support.
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // -------------------------------------------------------------------------
    // Collections
    // -------------------------------------------------------------------------
    const collectionsExists =
      (await db.listCollections({ name: 'collections' }).toArray()).length > 0;

    if (!collectionsExists) {
      await db.createCollection('collections', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'description', 'creator', 'category'],
            properties: {
              name:        { bsonType: 'string', maxLength: 100 },
              description: { bsonType: 'string', maxLength: 1000 },
              creator:     { bsonType: 'string' },
              isPublic:    { bsonType: 'bool' },
              isFeatured:  { bsonType: 'bool' },
              category: {
                bsonType: 'string',
                enum: ['abstract', 'portrait', 'landscape', 'fantasy', 'sci-fi', 'anime', 'photography', 'other'],
              },
            },
          },
        },
      });
      console.log("Collection 'collections' created.");
    }

    const col = db.collection('collections');
    await col.createIndex({ name: 'text', description: 'text' }, { name: 'collections_text_idx' });
    await col.createIndex({ creator: 1, createdAt: -1 }, { name: 'creator_createdAt_idx' });
    await col.createIndex({ category: 1, isPublic: 1, createdAt: -1 }, { name: 'category_isPublic_createdAt_idx' });
    await col.createIndex({ isFeatured: 1, createdAt: -1 }, { name: 'isFeatured_createdAt_idx' });
    await col.createIndex({ 'stats.floorPrice': 1 }, { name: 'stats_floorPrice_idx' });
    await col.createIndex({ 'stats.totalArtworks': -1 }, { name: 'stats_totalArtworks_desc_idx' });
    await col.createIndex({ tags: 1 }, { name: 'tags_idx' });
    await col.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    console.log("Indexes for 'collections' created.");

    // -------------------------------------------------------------------------
    // Comments
    // -------------------------------------------------------------------------
    const commentsExists =
      (await db.listCollections({ name: 'comments' }).toArray()).length > 0;

    if (!commentsExists) {
      await db.createCollection('comments', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['artwork', 'author', 'content', 'moderationStatus'],
            properties: {
              artwork:          { bsonType: 'objectId' },
              author:           { bsonType: 'string' },
              content:          { bsonType: 'string', maxLength: 1000 },
              moderationStatus: { bsonType: 'string', enum: ['pending', 'approved', 'rejected', 'hidden'] },
              isDeleted:        { bsonType: 'bool' },
            },
          },
        },
      });
      console.log("Collection 'comments' created.");
    }

    const comments = db.collection('comments');
    await comments.createIndex({ artwork: 1, moderationStatus: 1, createdAt: -1 }, { name: 'artwork_modStatus_createdAt_idx' });
    await comments.createIndex({ author: 1, isDeleted: 1, createdAt: -1 }, { name: 'author_isDeleted_createdAt_idx' });
    await comments.createIndex({ parentComment: 1, createdAt: 1 }, { name: 'parentComment_createdAt_idx' });
    await comments.createIndex({ moderationStatus: 1, createdAt: -1 }, { name: 'modStatus_createdAt_idx' });
    await comments.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    await comments.createIndex({ content: 'text' }, { name: 'content_text_idx' });
    console.log("Indexes for 'comments' created.");
  },

  async down(connection: any) {
    const db = connection.db;

    for (const name of ['comments', 'collections']) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (exists) {
        await db.collection(name).drop();
        console.log(`Collection '${name}' dropped.`);
      }
    }
  },
};
