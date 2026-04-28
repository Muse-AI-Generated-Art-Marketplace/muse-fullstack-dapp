import ContractUpgrade, { IContractUpgrade } from '@/models/ContractUpgrade';

/**
 * Service for managing contract upgrade history.
 */
class ContractUpgradeService {
  /**
   * Records a new contract upgrade event or updates an existing one.
   * @param upgradeData Data for the contract upgrade.
   * @returns The created or updated ContractUpgrade document.
   */
  public async recordUpgrade(upgradeData: Partial<IContractUpgrade>): Promise<IContractUpgrade> {
    if (upgradeData._id) {
      const updated = await ContractUpgrade.findByIdAndUpdate(
        upgradeData._id,
        { $set: upgradeData },
        { new: true }
      );
      if (!updated) {
        throw new Error(`ContractUpgrade record not found: ${upgradeData._id}`);
      }
      return updated;
    }
    const newUpgrade = new ContractUpgrade(upgradeData);
    return newUpgrade.save();
  }

  /**
   * Retrieves the history of contract upgrades, optionally filtered by contractId.
   * @param contractId Optional contract ID to filter by.
   * @param limit Maximum number of records to return.
   * @returns An array of ContractUpgrade documents.
   */
  public async getUpgradeHistory(contractId?: string, limit = 100): Promise<IContractUpgrade[]> {
    const query = contractId ? { contractId } : {};
    return ContractUpgrade.find(query).sort({ timestamp: -1 }).limit(limit).exec();
  }
}

export const contractUpgradeService = new ContractUpgradeService();
