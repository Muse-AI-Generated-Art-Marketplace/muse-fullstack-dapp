import { Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { contractUpgradeService } from '@/services/contractUpgradeService';
import { AuthRequest } from '@/middleware/authMiddleware';
import { createLogger } from '@/utils/logger';
import {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
} from '@/services/migrationService';

const execAsync = promisify(exec);
const logger = createLogger('AdminController');

/**
 * Admin controller for managing contract upgrades, migrations, and other
 * admin-level tasks. All routes must be protected by authenticateAdmin middleware.
 */
class AdminController {
  // ── Contract Upgrades ──────────────────────────────────────────────────────

  /**
   * POST /api/admin/contract/upgrade
   * Triggers a smart contract upgrade via a shell script.
   * Body: { contractId: string, newWasmPath: string }
   */
  public async upgradeContract(req: AuthRequest, res: Response): Promise<Response> {
    const { contractId, newWasmPath } = req.body;
    const adminAddress = req.user?.address;

    if (!contractId || !newWasmPath || !adminAddress) {
      return res.status(400).json({ error: 'Missing contractId, newWasmPath, or adminAddress.' });
    }

    // Basic path validation — prevent directory traversal
    if (newWasmPath.includes('..') || path.isAbsolute(newWasmPath)) {
      return res.status(400).json({ error: 'Invalid newWasmPath.' });
    }

    const scriptPath = path.resolve(
      __dirname,
      '../../../../packages/contracts/scripts/upgrade_contract.ts'
    );

    // Shell-escape arguments to prevent injection
    const safeContractId = contractId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeWasmPath = newWasmPath.replace(/[^a-zA-Z0-9_./-]/g, '');
    const command = `ts-node "${scriptPath}" "${safeContractId}" "${safeWasmPath}"`;

    let upgradeRecord;
    try {
      upgradeRecord = await contractUpgradeService.recordUpgrade({
        contractId,
        oldWasmHash: 'unknown', // populated after script output is parsed
        newWasmHash: newWasmPath,
        adminAddress,
        status: 'PENDING',
      });

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        logger.error('Contract upgrade script stderr', { stderr });
        await contractUpgradeService.recordUpgrade({
          _id: upgradeRecord._id,
          status: 'FAILED',
          error: stderr,
        } as any);
        return res.status(500).json({ message: 'Contract upgrade failed.', details: stderr });
      }

      logger.info('Contract upgrade stdout', { stdout });

      // TODO: parse stdout to extract actual wasm hash and transaction hash
      await contractUpgradeService.recordUpgrade({
        _id: upgradeRecord._id,
        status: 'SUCCESS',
      } as any);

      return res.status(200).json({ message: 'Contract upgrade initiated successfully.', output: stdout });
    } catch (error: any) {
      logger.error('Error during contract upgrade', { error: error.message });
      if (upgradeRecord) {
        await contractUpgradeService.recordUpgrade({
          _id: upgradeRecord._id,
          status: 'FAILED',
          error: error.message,
        } as any);
      }
      return res.status(500).json({ message: 'Failed to initiate contract upgrade.', error: error.message });
    }
  }

  /**
   * GET /api/admin/contract/history
   * Retrieves the history of contract upgrades.
   * Query: { contractId?: string, limit?: number }
   */
  public async getContractUpgradeHistory(req: AuthRequest, res: Response): Promise<Response> {
    const { contractId, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 100;

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
      return res.status(400).json({ error: 'limit must be a number between 1 and 500.' });
    }

    const history = await contractUpgradeService.getUpgradeHistory(
      contractId as string | undefined,
      parsedLimit
    );
    return res.status(200).json(history);
  }

  // ── Database Migrations ────────────────────────────────────────────────────

  /**
   * POST /api/admin/migrations/run
   * Runs all pending migrations.
   */
  public async runMigrations(_req: AuthRequest, res: Response): Promise<Response> {
    try {
      await runMigrations();
      return res.status(200).json({ message: 'Migrations completed successfully.' });
    } catch (error: any) {
      logger.error('Migration run failed', { error: error.message });
      return res.status(500).json({ message: 'Migration run failed.', error: error.message });
    }
  }

  /**
   * POST /api/admin/migrations/rollback
   * Rolls back the last executed migration.
   */
  public async rollbackMigration(_req: AuthRequest, res: Response): Promise<Response> {
    try {
      await rollbackMigration();
      return res.status(200).json({ message: 'Rollback completed successfully.' });
    } catch (error: any) {
      logger.error('Migration rollback failed', { error: error.message });
      return res.status(500).json({ message: 'Migration rollback failed.', error: error.message });
    }
  }

  /**
   * GET /api/admin/migrations/status
   * Returns the status of all migrations.
   */
  public async getMigrationStatus(_req: AuthRequest, res: Response): Promise<Response> {
    try {
      const status = await getMigrationStatusData();
      return res.status(200).json(status);
    } catch (error: any) {
      logger.error('Failed to get migration status', { error: error.message });
      return res.status(500).json({ message: 'Failed to get migration status.', error: error.message });
    }
  }
}

export const adminController = new AdminController();

// ── Helper: structured migration status for API response ──────────────────────

import mongoose from 'mongoose';
import fs from 'fs';
import path2 from 'path';

async function getMigrationStatusData() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const migrationsDir = path2.join(__dirname, '..', 'migrations');
  const files = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
        .sort()
    : [];

  const executed = await db.collection('migrations').find({}).toArray();
  const executedNames = new Set(executed.map((m: any) => m.name));

  return {
    total: files.length,
    executed: executed.length,
    pending: files.length - executedNames.size,
    migrations: files.map((name) => ({
      name,
      status: executedNames.has(name) ? 'executed' : 'pending',
      executedAt: (executed.find((m: any) => m.name === name) as any)?.executedAt ?? null,
    })),
  };
}
