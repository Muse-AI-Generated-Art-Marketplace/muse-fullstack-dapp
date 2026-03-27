/**
 * Migration: Create User collection with indexes
 * Description: Initial migration to set up User schema and create necessary indexes
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // Create User collection if it doesn't exist
    const userCollectionExists = await db
      .listCollections()
      .toArray()
      .then((collections: any[]) =>
        collections.some((c) => c.name === "users"),
      );

    if (!userCollectionExists) {
      await db.createCollection("users", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["address"],
            properties: {
              _id: { bsonType: "objectId" },
              address: {
                bsonType: "string",
                description: "Stellar wallet address (unique)",
              },
              username: {
                bsonType: "string",
                description: "Optional username",
              },
              bio: {
                bsonType: "string",
                description: "User biography",
              },
              profileImage: {
                bsonType: "string",
                description: "URL to profile image",
              },
              stats: {
                bsonType: "object",
                properties: {
                  created: {
                    bsonType: "int",
                    description: "Number of artworks created",
                  },
                  collected: {
                    bsonType: "int",
                    description: "Number of artworks collected",
                  },
                  favorites: {
                    bsonType: "int",
                    description: "Number of favorite artworks",
                  },
                },
              },
              createdAt: {
                bsonType: "date",
                description: "Account creation timestamp",
              },
              updatedAt: {
                bsonType: "date",
                description: "Last update timestamp",
              },
            },
          },
        },
      });
    }

    const usersCollection = db.collection("users");

    // Create indexes for better query performance
    await usersCollection.createIndex({ address: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 });
    await usersCollection.createIndex({ createdAt: 1 });
    await usersCollection.createIndex({ updatedAt: 1 });
  },

  async down(connection: any) {
    const db = connection.db;

    // Remove all indexes except the default _id index
    const usersCollection = db.collection("users");
    try {
      await usersCollection.dropIndex("address_1");
      await usersCollection.dropIndex("username_1");
      await usersCollection.dropIndex("createdAt_1");
      await usersCollection.dropIndex("updatedAt_1");
    } catch (error) {
      // Index might not exist, which is fine
    }

    // Drop the User collection
    const userCollectionExists = await db
      .listCollections()
      .toArray()
      .then((collections: any[]) =>
        collections.some((c) => c.name === "users"),
      );

    if (userCollectionExists) {
      await db.dropCollection("users");
    }
  },
};
