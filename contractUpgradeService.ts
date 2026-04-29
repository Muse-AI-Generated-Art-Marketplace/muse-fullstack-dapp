import ContractUpgrade, { IContractUpgrade } from '../models/ContractUpgrade';

/**
 * Service for managing contract upgrade history.
 */
class ContractUpgradeService {
  /**
   * Records a new contract upgrade event.
   * @param upgradeData Data for the contract upgrade.
   * @returns The created ContractUpgrade document.
   */
  public async recordUpgrade(upgradeData: Partial<IContractUpgrade>): Promise<IContractUpgrade> {
    const newUpgrade = new ContractUpgrade(upgradeData);
    return newUpgrade.save();
  }

  /**
   * Retrieves the history of contract upgrades for a given contract ID.
   * @param contractId The ID of the contract.
   * @param limit Maximum number of records to return.
   * @returns An array of ContractUpgrade documents.
   */
  public async getUpgradeHistory(contractId?: string, limit: number = 100): Promise<IContractUpgrade[]> {
    const query = contractId ? { contractId } : {};
    return ContractUpgrade.find(query).sort({ timestamp: -1 }).limit(limit).exec();
  }
}

export const contractUpgradeService = new ContractUpgradeService();