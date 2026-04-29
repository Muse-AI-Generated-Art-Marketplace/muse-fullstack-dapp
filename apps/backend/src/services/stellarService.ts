const StellarSdk: any = require("stellar-sdk");
import config from "../config/stellarConfig";

/**
 * Minimal Stellar service abstraction.
 * - Keeps SDK usage in one place
 * - Provides signature verification and a simple payment helper
 */

// TODO: Add Soroban/NFT minting helpers in future (keep out of this minimal change)

let server: any | null = null;

export const initClient = (): any => {
  if (server) return server;
  const rpc = config.HORIZON_RPC_URL;
  server = new StellarSdk.Server(rpc);
  return server;
};

/**
 * Verifies a base64 signature for a message against a Stellar public key.
 * Returns `true` when valid, `false` otherwise.
 */
export const verifySignature = (
  message: string,
  signature: string,
  publicKey: string,
): boolean => {
  try {
    const kp = StellarSdk.Keypair.fromPublicKey(publicKey);
    const messageBuffer = Buffer.from(message);
    const signatureBuffer = Buffer.from(signature, "base64");
    return kp.verify(messageBuffer, signatureBuffer);
  } catch (err) {
    return false;
  }
};

/**
 * Submits a built and signed transaction to Horizon with one retry.
 */
export const submitTransaction = async (tx: any): Promise<any> => {
  const client = initClient();
  try {
    return await client.submitTransaction(tx);
  } catch (firstErr) {
    // one retry
    try {
      return await client.submitTransaction(tx);
    } catch (err) {
      // Normalize the error to a safe message
      const msg =
        err &&
        err.response &&
        err.response.data &&
        err.response.data.extras &&
        err.response.data.extras.result_codes
          ? "Transaction failed"
          : "Transaction failed";
      const error: any = new Error(msg);
      error.cause = err;
      throw error;
    }
  }
};

/**
 * Sends a native XLM payment from a secret key to a destination.
 * Does not return secrets. Throws on failure with safe messages.
 */
export const sendPayment = async (
  senderSecret: string,
  receiverPublicKey: string,
  amount: string,
): Promise<any> => {
  const client = initClient();
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
    const publicKey = sourceKeypair.publicKey();
    const account = await client.loadAccount(publicKey);

    const networkPassphrase =
      config.STELLAR_NETWORK === "mainnet"
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET;

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: StellarSdk.Asset.native(),
          amount,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);

    const res = await submitTransaction(tx);
    return {
      success: true,
      hash: res && res.hash ? res.hash : undefined,
    };
  } catch (err: any) {
    const e = new Error("Transaction failed");
    (e as any).cause = err;
    throw e;
  }
};

export default {
  initClient,
  verifySignature,
  sendPayment,
  submitTransaction,
};
