// Stellar configuration wrapper
export const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || "";
export const STELLAR_NETWORK = (
  process.env.STELLAR_NETWORK || "testnet"
).toLowerCase();
export const STELLAR_CONTRACT_ID = process.env.STELLAR_CONTRACT_ID || "";

// Derive a Horizon-compatible URL when Soroban RPC is provided by env examples
export const HORIZON_RPC_URL = (() => {
  const url = STELLAR_RPC_URL;
  if (!url) {
    return STELLAR_NETWORK === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  }
  // If user set a Soroban RPC (common in repo examples), prefer known Horizon endpoints
  if (url.includes("soroban")) {
    return STELLAR_NETWORK === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org";
  }
  return url;
})();

export default {
  STELLAR_RPC_URL,
  STELLAR_NETWORK,
  STELLAR_CONTRACT_ID,
  HORIZON_RPC_URL,
};
