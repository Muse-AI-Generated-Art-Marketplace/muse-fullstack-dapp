const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  startDate?: string
  endDate?: string
  type?: string
  status?: string
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function exportTransactions(options: ExportOptions): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Authentication required')

  const params = new URLSearchParams({ format: options.format })
  if (options.startDate) params.set('startDate', options.startDate)
  if (options.endDate) params.set('endDate', options.endDate)
  if (options.type) params.set('type', options.type)
  if (options.status) params.set('status', options.status)

  const response = await fetch(`${API_BASE_URL}/api/transactions/export?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Export failed' }))
    throw new Error(err.message || 'Export failed')
  }

  if (options.format === 'pdf') {
    // Open printable HTML in new tab so user can print-to-PDF
    const html = await response.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.focus()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    return
  }

  // For CSV / JSON: trigger file download
  const blob = await response.blob()
  const ext = options.format
  const filename = `muse-transactions-${new Date().toISOString().slice(0, 10)}.${ext}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
