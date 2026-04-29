import mongoose, { Document, Schema } from 'mongoose';

export interface IContractUpgrade extends Document {
  contractId: string;
  oldWasmHash: string;
  newWasmHash: string;
  adminAddress: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionHash?: string;
  error?: string;
}

const ContractUpgradeSchema: Schema = new Schema({
  contractId: { type: String, required: true, index: true },
  oldWasmHash: { type: String, required: true },
  newWasmHash: { type: String, required: true },
  adminAddress: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'PENDING', required: true },
  transactionHash: { type: String, unique: true, sparse: true },
  error: { type: String },
});

ContractUpgradeSchema.index({ contractId: 1, timestamp: -1 });
ContractUpgradeSchema.index({ adminAddress: 1, timestamp: -1 });

const ContractUpgrade = mongoose.model<IContractUpgrade>('ContractUpgrade', ContractUpgradeSchema);
export default ContractUpgrade;