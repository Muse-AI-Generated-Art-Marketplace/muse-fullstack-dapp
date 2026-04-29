/**
 * Migration: Create Transactions, Bids, and Auctions collections
 * Description: Sets up the transactions, bids, and auctions collections with
 *              schema validation, required indexes, and TTL expiry where applicable.
 */

export default {
  async up(connection: any) {
    const db = connection.db;

    // -------------------------------------------------------------------------
    // Transactions
    // -------------------------------------------------------------------------
    const txExists =
      (await db.listCollections({ name: 'transactions' }).toArray()).length > 0;

    if (!txExists) {
      await db.createCollection('transactions', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['hash', 'type', 'artwork', 'from', 'price', 'currency', 'network', 'status'],
            properties: {
              hash:     { bsonType: 'string' },
              type:     { bsonType: 'string', enum: ['mint', 'sale', 'transfer', 'bid', 'cancel'] },
              artwork:  { bsonType: 'objectId' },
              from:     { bsonType: 'string' },
              price:    { bsonType: 'string' },
              currency: { bsonType: 'string', enum: ['XLM', 'USD', 'EUR'] },
              network:  { bsonType: 'string', enum: ['testnet', 'mainnet'] },
              status:   { bsonType: 'string', enum: ['pending', 'confirming', 'processing', 'completed', 'failed', 'cancelled'] },
            },
          },
        },
      });
      console.log("Collection 'transactions' created.");
    }

    const tx = db.collection('transactions');
    await tx.createIndex({ hash: 1 }, { unique: true, name: 'hash_unique_idx' });
    await tx.createIndex({ artwork: 1, createdAt: -1 }, { name: 'artwork_createdAt_idx' });
    await tx.createIndex({ from: 1, createdAt: -1 }, { name: 'from_createdAt_idx' });
    await tx.createIndex({ to: 1, createdAt: -1 }, { name: 'to_createdAt_idx' });
    await tx.createIndex({ type: 1, status: 1, createdAt: -1 }, { name: 'type_status_createdAt_idx' });
    await tx.createIndex({ network: 1, status: 1, createdAt: -1 }, { name: 'network_status_createdAt_idx' });
    await tx.createIndex({ status: 1, createdAt: -1 }, { name: 'status_createdAt_idx' });
    await tx.createIndex({ blockNumber: 1 }, { name: 'blockNumber_idx' });
    await tx.createIndex({ idempotencyKey: 1 }, { sparse: true, name: 'idempotencyKey_sparse_idx' });
    await tx.createIndex({ externalId: 1 }, { sparse: true, name: 'externalId_sparse_idx' });
    await tx.createIndex(
      { hash: 'text', from: 'text', to: 'text', externalId: 'text', failureReason: 'text' },
      { name: 'transactions_text_idx' },
    );
    console.log("Indexes for 'transactions' created.");

    // -------------------------------------------------------------------------
    // Bids
    // -------------------------------------------------------------------------
    const bidsExists =
      (await db.listCollections({ name: 'bids' }).toArray()).length > 0;

    if (!bidsExists) {
      await db.createCollection('bids', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['artwork', 'bidder', 'amount', 'currency', 'status', 'network'],
            properties: {
              artwork:  { bsonType: 'objectId' },
              bidder:   { bsonType: 'string' },
              amount:   { bsonType: 'string' },
              currency: { bsonType: 'string', enum: ['XLM', 'USD', 'EUR'] },
              status:   { bsonType: 'string', enum: ['active', 'accepted', 'rejected', 'expired', 'withdrawn'] },
              network:  { bsonType: 'string', enum: ['testnet', 'mainnet'] },
            },
          },
        },
      });
      console.log("Collection 'bids' created.");
    }

    const bids = db.collection('bids');
    await bids.createIndex({ transactionHash: 1 }, { unique: true, sparse: true, name: 'transactionHash_unique_sparse_idx' });
    await bids.createIndex({ artwork: 1, status: 1, amount: -1 }, { name: 'artwork_status_amount_idx' });
    await bids.createIndex({ bidder: 1, status: 1, createdAt: -1 }, { name: 'bidder_status_createdAt_idx' });
    await bids.createIndex({ status: 1, expiresAt: 1 }, { name: 'status_expiresAt_idx' });
    await bids.createIndex({ network: 1, status: 1 }, { name: 'network_status_idx' });
    await bids.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    // TTL index — MongoDB removes documents when expiresAt is reached
    await bids.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'bids_ttl_idx' });
    console.log("Indexes for 'bids' created.");

    // -------------------------------------------------------------------------
    // Auctions
    // -------------------------------------------------------------------------
    const auctionsExists =
      (await db.listCollections({ name: 'auctions' }).toArray()).length > 0;

    if (!auctionsExists) {
      await db.createCollection('auctions', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['artwork', 'seller', 'startingPrice', 'endTime', 'startTime', 'status', 'bidIncrement', 'network'],
            properties: {
              artwork:       { bsonType: 'objectId' },
              seller:        { bsonType: 'string' },
              startingPrice: { bsonType: 'string' },
              endTime:       { bsonType: 'date' },
              startTime:     { bsonType: 'date' },
              status:        { bsonType: 'string', enum: ['upcoming', 'active', 'ended', 'cancelled', 'sold'] },
              bidIncrement:  { bsonType: 'string' },
              network:       { bsonType: 'string', enum: ['testnet', 'mainnet'] },
            },
          },
        },
      });
      console.log("Collection 'auctions' created.");
    }

    const auctions = db.collection('auctions');
    await auctions.createIndex({ artwork: 1 }, { unique: true, name: 'artwork_unique_idx' });
    await auctions.createIndex({ transactionHash: 1 }, { unique: true, sparse: true, name: 'transactionHash_unique_sparse_idx' });
    await auctions.createIndex({ status: 1, endTime: 1 }, { name: 'status_endTime_idx' });
    await auctions.createIndex({ seller: 1, status: 1, createdAt: -1 }, { name: 'seller_status_createdAt_idx' });
    await auctions.createIndex({ currentBidder: 1, status: 1 }, { name: 'currentBidder_status_idx' });
    await auctions.createIndex({ network: 1, status: 1 }, { name: 'network_status_idx' });
    await auctions.createIndex({ startTime: 1, endTime: 1 }, { name: 'startTime_endTime_idx' });
    await auctions.createIndex({ createdAt: -1 }, { name: 'createdAt_desc_idx' });
    console.log("Indexes for 'auctions' created.");
  },

  async down(connection: any) {
    const db = connection.db;

    for (const name of ['auctions', 'bids', 'transactions']) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (exists) {
        await db.collection(name).drop();
        console.log(`Collection '${name}' dropped.`);
      }
    }
  },
};
