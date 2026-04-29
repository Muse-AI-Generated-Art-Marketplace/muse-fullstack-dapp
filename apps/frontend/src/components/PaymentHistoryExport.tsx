import { useState } from 'react'
import { exportTransactions, ExportFormat } from '@/services/exportService'

interface ExportState {
  loading: boolean
  error: string | null
  success: string | null
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'csv', label: 'CSV', description: 'Compatible with Excel & accounting software' },
  { value: 'json', label: 'JSON', description: 'Structured data for developer integration' },
  { value: 'pdf', label: 'PDF', description: 'Branded printable report' }
]

const QUICK_RANGES = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last year', days: 365 },
]

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function PaymentHistoryExport() {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [state, setState] = useState<ExportState>({ loading: false, error: null, success: null })

  function applyQuickRange(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setStartDate(isoDate(start))
    setEndDate(isoDate(end))
  }

  async function handleExport() {
    setState({ loading: true, error: null, success: null })
    try {
      await exportTransactions({
        format,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      setState({
        loading: false,
        error: null,
        success: format === 'pdf'
          ? 'Report opened in a new tab. Use your browser\'s Print → Save as PDF.'
          : `${format.toUpperCase()} file downloaded successfully.`
      })
    } catch (err) {
      setState({ loading: false, error: (err as Error).message, success: null })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Export Payment History</h2>
      <p className="text-sm text-gray-500 mb-6">Download your transaction records for accounting or record-keeping.</p>

      {/* Format selector */}
      <fieldset className="mb-5">
        <legend className="text-sm font-medium text-gray-700 mb-2">Export format</legend>
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormat(opt.value)}
              className={`flex flex-col items-center rounded-xl border-2 p-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                format === opt.value
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-violet-300'
              }`}
              aria-pressed={format === opt.value}
            >
              <span className="text-base font-bold">{opt.label}</span>
              <span className="mt-1 text-xs leading-tight">{opt.description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Date range */}
      <fieldset className="mb-5">
        <legend className="text-sm font-medium text-gray-700 mb-2">Date range <span className="font-normal text-gray-400">(optional)</span></legend>
        <div className="flex gap-2 mb-2">
          {QUICK_RANGES.map(r => (
            <button
              key={r.days}
              type="button"
              onClick={() => applyQuickRange(r.days)}
              className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="export-start" className="block text-xs text-gray-500 mb-1">From</label>
            <input
              id="export-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={endDate || isoDate(new Date())}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="export-end" className="block text-xs text-gray-500 mb-1">To</label>
            <input
              id="export-end"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              max={isoDate(new Date())}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Feedback */}
      {state.error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      {/* Export button */}
      <button
        type="button"
        onClick={handleExport}
        disabled={state.loading}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        {state.loading ? 'Exporting…' : `Export as ${format.toUpperCase()}`}
      </button>
    </div>
  )
}

export default PaymentHistoryExport
