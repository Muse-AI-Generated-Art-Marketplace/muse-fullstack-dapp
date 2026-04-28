import { Response, NextFunction } from 'express'
import { Transaction } from '@/models/Transaction'
import { AuthRequest } from '@/middleware/authMiddleware'

type ExportFormat = 'csv' | 'json' | 'pdf'

function buildQuery(req: AuthRequest) {
  const { startDate, endDate, type, status } = req.query
  const query: Record<string, any> = {
    $or: [{ from: req.user!.address }, { to: req.user!.address }]
  }
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate as string)
    if (endDate) query.createdAt.$lte = new Date(endDate as string)
  }
  if (type) query.type = Array.isArray(type) ? { $in: type } : type
  if (status) query.status = Array.isArray(status) ? { $in: status } : status
  return query
}

function toCSV(transactions: any[]): string {
  const headers = ['Date', 'Hash', 'Type', 'Status', 'From', 'To', 'Price', 'Currency', 'Network', 'Fee']
  const rows = transactions.map(t => [
    new Date(t.createdAt).toISOString(),
    t.hash,
    t.type,
    t.status,
    t.from,
    t.to || '',
    t.price,
    t.currency,
    t.network,
    t.fee || ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...rows].join('\n')
}

function toPDF(transactions: any[], dateRange: { start?: string; end?: string }): string {
  const rangeLabel = dateRange.start || dateRange.end
    ? `Period: ${dateRange.start || 'All'} – ${dateRange.end || 'Now'}`
    : 'All time'

  const rows = transactions.map(t => `
    <tr>
      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
      <td style="font-family:monospace;font-size:11px">${t.hash.slice(0, 16)}…</td>
      <td>${t.type}</td>
      <td>${t.status}</td>
      <td>${t.price} ${t.currency}</td>
      <td>${t.fee || '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Muse Payment History</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
  h1 { color: #6d28d9; }
  .meta { color: #555; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #6d28d9; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<h1>Muse – Payment History</h1>
<p class="meta">${rangeLabel} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total: ${transactions.length} transactions</p>
<table>
  <thead><tr><th>Date</th><th>Hash</th><th>Type</th><th>Status</th><th>Amount</th><th>Fee</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="footer">Muse AI Art Marketplace – Confidential</p>
</body>
</html>`
}

export const exportController = {
  async exportTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as ExportFormat) || 'json'
      if (!['csv', 'json', 'pdf'].includes(format)) {
        res.status(400).json({ success: false, message: 'Invalid format. Use csv, json, or pdf.' })
        return
      }

      const query = buildQuery(req)
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(10000)
        .lean()

      const filename = `muse-transactions-${Date.now()}`

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`)
        res.json({ exported_at: new Date().toISOString(), count: transactions.length, transactions })
        return
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
        res.send(toCSV(transactions))
        return
      }

      // pdf – return HTML that the browser can print-to-PDF
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('Content-Disposition', `inline; filename="${filename}.html"`)
      res.send(toPDF(transactions, {
        start: req.query.startDate as string | undefined,
        end: req.query.endDate as string | undefined
      }))
    } catch (error) {
      next(error)
    }
  }
}
