import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { contractUpgradeService } from '../services/contractUpgradeService';
import { IContractUpgrade } from '../models/ContractUpgrade';

const execAsync = promisify(exec);

/**
 * Admin controller for managing contract upgrades and other admin-level tasks.
 * NOTE: These endpoints should be heavily protected by strong authentication and authorization middleware.
 */
class AdminController {
  /**
   * Triggers a smart contract upgrade.
   * This endpoint executes a shell script to perform the upgrade.
   * Requires: contractId, newWasmPath
   */
  public async upgradeContract(req: Request, res: Response): Promise<Response> {
    const { contractId, newWasmPath } = req.body;
    const adminAddress = req.user?.address; // Assuming admin address is available from auth middleware

    if (!contractId || !newWasmPath || !adminAddress) {
      return res.status(400).json({ error: 'Missing contractId, newWasmPath, or adminAddress.' });
    }

    const scriptPath = path.resolve(__dirname, '../../../packages/contracts/scripts/upgrade_contract.ts');
    const command = `ts-node ${scriptPath} ${contractId} ${newWasmPath}`;

    let upgradeRecord: IContractUpgrade | null = null;
    try {
      upgradeRecord = await contractUpgradeService.recordUpgrade({
        contractId,
        newWasmHash: newWasmPath, // Temporarily store path, will be updated with actual hash
        adminAddress,
        status: 'PENDING',
      });

      const { stdout, stderr } = await execAsync(command);
      console.log(`Contract Upgrade Output:\n${stdout}`);
      if (stderr) {
        console.error(`Contract Upgrade Error:\n${stderr}`);
        await contractUpgradeService.recordUpgrade({ _id: upgradeRecord._id, status: 'FAILED', error: stderr });
        return res.status(500).json({ message: 'Contract upgrade failed.', details: stderr });
      }

      await contractUpgradeService.recordUpgrade({ _id: upgradeRecord._id, status: 'SUCCESS', transactionHash: 'TODO: Extract from stdout' }); // TODO: Parse stdout for actual wasm hash and tx hash
      return res.status(200).json({ message: 'Contract upgrade initiated successfully.', output: stdout });
    } catch (error: any) {
      console.error('Error during contract upgrade:', error);
      if (upgradeRecord) {
        await contractUpgradeService.recordUpgrade({ _id: upgradeRecord._id, status: 'FAILED', error: error.message });
      }
      return res.status(500).json({ message: 'Failed to initiate contract upgrade.', error: error.message });
    }
  }

  /**
   * Retrieves the history of contract upgrades.
   */
  public async getContractUpgradeHistory(req: Request, res: Response): Promise<Response> {
    const { contractId } = req.query;
    const history = await contractUpgradeService.getUpgradeHistory(contractId as string);
    return res.status(200).json(history);
  }
}

export const adminController = new AdminController();