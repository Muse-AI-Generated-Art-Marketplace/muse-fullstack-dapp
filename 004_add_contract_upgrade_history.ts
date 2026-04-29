/**
 * Migration: Add ContractUpgradeHistory collection
 * Description: Creates a new collection to track smart contract upgrade events.
 */

import { Db } from 'mongodb';

export default {
  async up(connection: { db: Db }) {
    const db = connection.db;
    const collectionName = 'contractupgrades';

    // Create the collection if it doesn't exist
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
      console.log(`Collection '${collectionName}' created.`);
    }

    // Add indexes
    const contractUpgradesCollection = db.collection(collectionName);
    await contractUpgradesCollection.createIndex({ contractId: 1, timestamp: -1 }, { name: 'contractId_timestamp_idx' });
    await contractUpgradesCollection.createIndex({ adminAddress: 1, timestamp: -1 }, { name: 'adminAddress_timestamp_idx' });
    await contractUpgradesCollection.createIndex({ transactionHash: 1 }, { unique: true, sparse: true, name: 'transactionHash_unique_idx' });

    console.log(`Indexes for '${collectionName}' created.`);
  },

  async down(connection: { db: Db }) {
    const db = connection.db;
    const collectionName = 'contractupgrades';

    // Drop the collection
    await db.collection(collectionName).drop();
    console.log(`Collection '${collectionName}' dropped.`);
  },
};