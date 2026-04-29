export const transactionMonitor = {
  addTransaction: (hash: string, status: string) => {
    console.log(`[TransactionMonitor] Added transaction: ${hash} with status: ${status}`)
  },
  updateTransaction: (hash: string, status: string) => {
    console.log(`[TransactionMonitor] Updated transaction: ${hash} to status: ${status}`)
  },
  removeTransaction: (hash: string) => {
    console.log(`[TransactionMonitor] Removed transaction: ${hash}`)
  }
}

export default transactionMonitor