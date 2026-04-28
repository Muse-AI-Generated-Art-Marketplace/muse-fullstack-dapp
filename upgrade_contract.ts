import {
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  SorobanRpc,
  xdr,
} from 'soroban-client';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '../../.env' });

const networkPassphrase = Networks.TESTNET; // Or Networks.PUBLIC for mainnet
const rpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const server = new SorobanRpc.Server(rpcUrl, { allowHttp: true });

async function upgradeContract(
  contractId: string,
  newWasmPath: string,
  adminSecret: string
) {
  const adminKeypair = Keypair.fromSecret(adminSecret);
  const adminPublicKey = adminKeypair.publicKey();

  console.log(`Attempting to upgrade contract ${contractId} with admin ${adminPublicKey}`);
  console.log(`New Wasm file: ${newWasmPath}`);

  // 1. Read the new WASM file
  const wasm = fs.readFileSync(path.resolve(__dirname, newWasmPath));

  // 2. Upload the new WASM to the network to get its hash
  console.log('Uploading new WASM to the network...');
  const uploadTx = await server.prepareTransaction(
    TransactionBuilder.forAccount(adminPublicKey, await server.getAccount(adminPublicKey).then(a => a.sequence))
      .addOperation(Operation.uploadContractCode({ code: wasm }))
      .setTimeout(30)
      .build(),
    networkPassphrase
  );

  uploadTx.sign(adminKeypair);
  const uploadResult = await server.sendTransaction(uploadTx);
  if (uploadResult.status === 'PENDING') {
    console.log('WASM upload transaction submitted. Waiting for confirmation...');
    const uploadStatus = await server.getTransaction(uploadResult.hash);
    if (uploadStatus.status === 'SUCCESS') {
      const newWasmHash = (uploadStatus.resultXdr as xdr.TransactionResult).result().results()[0].tr().uploadContractCodeResult().hash();
      console.log(`New WASM uploaded successfully. Hash: ${newWasmHash.toString('hex')}`);

      // 3. Call the contract's 'upgrade' function
      const contract = new Contract(contractId);
      const tx = await server.prepareTransaction(
        TransactionBuilder.forAccount(adminPublicKey, await server.getAccount(adminPublicKey).then(a => a.sequence))
          .addOperation(contract.call('upgrade', ...[newWasmHash]))
          .setTimeout(30)
          .build(),
        networkPassphrase
      );

      tx.sign(adminKeypair);
      console.log('Submitting contract upgrade transaction...');
      const result = await server.sendTransaction(tx);

      if (result.status === 'PENDING') {
        console.log(`Upgrade transaction submitted. Hash: ${result.hash}. Waiting for confirmation...`);
        const status = await server.getTransaction(result.hash);
        console.log(`Upgrade transaction status: ${status.status}`);
        if (status.status === 'SUCCESS') {
          console.log('Contract upgraded successfully!');
        } else {
          console.error('Contract upgrade failed:', status.error);
        }
      } else {
        console.error('Failed to submit upgrade transaction:', result.error);
      }
    } else {
      console.error('WASM upload failed:', uploadStatus.error);
    }
  } else {
    console.error('Failed to submit WASM upload transaction:', uploadResult.error);
  }
}

const contractId = process.argv[2];
const newWasmPath = process.argv[3];
const adminSecret = process.env.ADMIN_SECRET_KEY; // Ensure this is set in your .env

if (!contractId || !newWasmPath || !adminSecret) {
  console.error('Usage: ts-node upgrade_contract.ts <contract-id> <path-to-new-wasm>');
  console.error('Ensure ADMIN_SECRET_KEY is set in your .env file.');
  process.exit(1);
}

upgradeContract(contractId, newWasmPath, adminSecret).catch(e => {
  console.error('An error occurred during contract upgrade:', e);
  process.exit(1);
});