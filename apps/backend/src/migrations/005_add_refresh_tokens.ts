import { Db } from 'mongodb';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Migration005');

export const up = async (db: Db): Promise<void> => {
  logger.info('Running migration 005: Add refreshTokens field to users');

  const usersCollection = db.collection('users');

  // Add refreshTokens field to all existing users
  const result = await usersCollection.updateMany(
    { refreshTokens: { $exists: false } },
    { $set: { refreshTokens: [] } }
  );

  logger.info(`Migration 005 complete: Updated ${result.modifiedCount} users`);
};

export const down = async (db: Db): Promise<void> => {
  logger.info('Rolling back migration 005: Remove refreshTokens field');

  const usersCollection = db.collection('users');

  const result = await usersCollection.updateMany(
    {},
    { $unset: { refreshTokens: '' } }
  );

  logger.info(`Migration 005 rollback complete: Updated ${result.modifiedCount} users`);
};
