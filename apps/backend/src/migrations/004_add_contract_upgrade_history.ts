/**
 * Migration: Add ContractUpgradeHistory collection
 * Description: Creates the contractupgrades collection to track smart contract
 *              upgrade events, with appropriate indexes for efficient querying.
 */

export default {
  async up(connection: any) {
    const db = connection.db;
    const collectionName = 'contractupgrades';

    // Create the collection if it doesn't exist
    const existing = await db.listCollections({ name: collectionName }).toArray();
    if (existing.length === 0) {
      await db.createCollection(collectionName);
      console.log(`Collection '${collectionName}' created.`);
    }

    const col = db.collection(collectionName);

    await col.createIndex(
      { contractId: 1, timestamp: -1 },
      { name: 'contractId_timestamp_idx' }
    );
    await col.createIndex(
      { adminAddress: 1, timestamp: -1 },
      { name: 'adminAddress_timestamp_idx' }
    );
    await col.createIndex(
      { transactionHash: 1 },
      { unique: true, sparse: true, name: 'transactionHash_unique_idx' }
    );

    console.log(`Indexes for '${collectionName}' created.`);
  },

  async down(connection: any) {
    const db = connection.db;
    const collectionName = 'contractupgrades';

    const existing = await db.listCollections({ name: collectionName }).toArray();
    if (existing.length > 0) {
      await db.collection(collectionName).drop();
      console.log(`Collection '${collectionName}' dropped.`);
    }
  },
};
