/**
 * Migration: Create ApiKeys and Webhooks collections
 * Description: Sets up the apikeys and webhooks collections with appropriate
 *              indexes for secure key lookups and efficient webhook delivery queries.
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // -------------------------------------------------------------------------
    // ApiKeys
    // -------------------------------------------------------------------------
    const apikeysExists =
      (await db.listCollections({ name: 'apikeys' }).toArray()).length > 0;

    if (!apikeysExists) {
      await db.createCollection('apikeys', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'key', 'hashedKey', 'userId', 'permissions'],
            properties: {
              name:      { bsonType: 'string', maxLength: 100 },
              key:       { bsonType: 'string' },
              hashedKey: { bsonType: 'string' },
              userId:    { bsonType: 'objectId' },
              isActive:  { bsonType: 'bool' },
            },
          },
        },
      });
      console.log("Collection 'apikeys' created.");
    }

    const apikeys = db.collection('apikeys');
    await apikeys.createIndex({ key: 1 }, { unique: true, name: 'key_unique_idx' });
    await apikeys.createIndex({ hashedKey: 1 }, { unique: true, name: 'hashedKey_unique_idx' });
    await apikeys.createIndex({ userId: 1, isActive: 1 }, { name: 'userId_isActive_idx' });
    await apikeys.createIndex({ expiresAt: 1 }, { name: 'expiresAt_idx' });
    console.log("Indexes for 'apikeys' created.");

    // -------------------------------------------------------------------------
    // Webhooks
    // -------------------------------------------------------------------------
    const webhooksExists =
      (await db.listCollections({ name: 'webhooks' }).toArray()).length > 0;

    if (!webhooksExists) {
      await db.createCollection('webhooks', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'url', 'events', 'secretHash'],
            properties: {
              userId:     { bsonType: 'string' },
              url:        { bsonType: 'string' },
              events:     { bsonType: 'array' },
              secretHash: { bsonType: 'string' },
              isActive:   { bsonType: 'bool' },
            },
          },
        },
      });
      console.log("Collection 'webhooks' created.");
    }

    const webhooks = db.collection('webhooks');
    await webhooks.createIndex({ userId: 1 }, { name: 'userId_idx' });
    await webhooks.createIndex({ userId: 1, isActive: 1 }, { name: 'userId_isActive_idx' });
    await webhooks.createIndex({ events: 1 }, { name: 'events_idx' });
    await webhooks.createIndex({ isActive: 1 }, { name: 'isActive_idx' });
    console.log("Indexes for 'webhooks' created.");
  },

  async down(connection: any) {
    const db = connection.db;

    for (const name of ['webhooks', 'apikeys']) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (exists) {
        await db.collection(name).drop();
        console.log(`Collection '${name}' dropped.`);
      }
    }
  },
};
