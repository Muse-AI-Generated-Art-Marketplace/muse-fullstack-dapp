/**
 * Migration: Create Artwork collection with indexes
 * Description: Initial migration to set up Artwork schema and create necessary indexes
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // Create Artwork collection if it doesn't exist
    const artworkCollectionExists = await db
      .listCollections()
      .toArray()
      .then((collections: any[]) =>
        collections.some((c) => c.name === "artworks"),
      );

    if (!artworkCollectionExists) {
      await db.createCollection("artworks", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["id", "title", "creator", "image", "currency"],
            properties: {
              _id: { bsonType: "objectId" },
              id: {
                bsonType: "string",
                description: "Unique artwork identifier (unique)",
              },
              title: {
                bsonType: "string",
                description: "Artwork title",
              },
              description: {
                bsonType: "string",
                description: "Artwork description",
              },
              creator: {
                bsonType: "string",
                description: "Creator wallet address",
              },
              image: {
                bsonType: "string",
                description: "URL to artwork image",
              },
              price: {
                bsonType: "string",
                description: "Artwork price",
              },
              currency: {
                bsonType: "string",
                description: "Currency for pricing (e.g., XLM)",
              },
              metadata: {
                bsonType: "object",
                properties: {
                  category: {
                    bsonType: "string",
                    description: "Artwork category",
                  },
                  attributes: {
                    bsonType: "object",
                    description: "Custom attributes",
                  },
                  tags: {
                    bsonType: "array",
                    items: { bsonType: "string" },
                    description: "Tags for the artwork",
                  },
                },
              },
              createdAt: {
                bsonType: "date",
                description: "Creation timestamp",
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

    const artworksCollection = db.collection("artworks");

    // Create indexes for better query performance
    await artworksCollection.createIndex({ id: 1 }, { unique: true });
    await artworksCollection.createIndex({ creator: 1 });
    await artworksCollection.createIndex({
      title: "text",
      description: "text",
    });
    await artworksCollection.createIndex({ "metadata.category": 1 });
    await artworksCollection.createIndex({ "metadata.tags": 1 });
    await artworksCollection.createIndex({ createdAt: 1 });
    await artworksCollection.createIndex({ updatedAt: 1 });
    await artworksCollection.createIndex({ createdAt: -1 }); // For sorting by newest
  },

  async down(connection: any) {
    const db = connection.db;

    // Remove all indexes except the default _id index
    const artworksCollection = db.collection("artworks");
    try {
      await artworksCollection.dropIndex("id_1");
      await artworksCollection.dropIndex("creator_1");
      await artworksCollection.dropIndex("title_text_description_text");
      await artworksCollection.dropIndex("metadata.category_1");
      await artworksCollection.dropIndex("metadata.tags_1");
      await artworksCollection.dropIndex("createdAt_1");
      await artworksCollection.dropIndex("updatedAt_1");
      await artworksCollection.dropIndex("createdAt_-1");
    } catch (error) {
      // Index might not exist, which is fine
    }

    // Drop the Artwork collection
    const artworkCollectionExists = await db
      .listCollections()
      .toArray()
      .then((collections: any[]) =>
        collections.some((c) => c.name === "artworks"),
      );

    if (artworkCollectionExists) {
      await db.dropCollection("artworks");
    }
  },
};
