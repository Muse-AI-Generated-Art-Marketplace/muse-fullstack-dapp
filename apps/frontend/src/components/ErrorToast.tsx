import React, { useEffect, useState } from 'react'
import { useErrorContext } from '@/contexts/ErrorContext'
import { AppError } from '@/utils/errorHandler'

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons: Record<string, string> = {
  NETWORK_ERROR: '🌐',
  WALLET_ERROR: '👛',
  WALLET_NOT_CONNECTED: '👛',
  WALLET_REJECTED: '❌',
  WALLET_LOCKED: '🔒',
  WALLET_TIMEOUT: '⏱️',
  WALLET_NETWORK_MISMATCH: '⚡',
  WALLET_SIGNATURE_ERROR: '✍️',
  INSUFFICIENT_BALANCE: '💸',
  VALIDATION_ERROR: '⚠️',
  NOT_FOUND: '🔍',
  UNAUTHORIZED: '🔐',
  FORBIDDEN: '🚫',
  RATE_LIMIT_EXCEEDED: '⏳',
  INTERNAL_SERVER_ERROR: '🛠️',
  GENERAL_ERROR: '⚠️',
}

const colourMap: Record<string, { border: string; bg: string; title: string; badge: string }> = {
  INSUFFICIENT_BALANCE: {
    border: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    title: '#fca5a5',
    badge: 'rgba(239,68,68,0.25)',
  },
  NOT_FOUND: {
    border: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    title: '#a5b4fc',
    badge: 'rgba(99,102,241,0.25)',
  },
  UNAUTHORIZED: {
    border: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    title: '#fcd34d',
    badge: 'rgba(245,158,11,0.25)',
  },
  FORBIDDEN: {
    border: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    title: '#fca5a5',
    badge: 'rgba(239,68,68,0.25)',
  },
  default: {
    border: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    title: '#c4b5fd',
    badge: 'rgba(139,92,246,0.25)',
  },
}

function getColour(code: string) {
  return colourMap[code] ?? colourMap.default
}

// ── Single Toast ──────────────────────────────────────────────────────────────
function Toast({ error, onDismiss }: { error: AppError; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // mount animation
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const colour = getColour(error.code)
  const icon = icons[error.code] ?? '⚠️'

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: `1px solid ${colour.border}`,
        background: colour.bg,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${colour.border}22`,
        maxWidth: '380px',
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(32px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        cursor: 'default',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge */}
          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '999px',
              background: colour.badge,
              color: colour.title,
              marginBottom: '4px',
            }}
          >
            {error.code.replace(/_/g, ' ')}
          </span>
          {/* User message */}
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.45',
              color: '#e2e8f0',
              fontWeight: 400,
            }}
          >
            {error.userMessage}
          </p>
        </div>
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss error"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px',
            borderRadius: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#e2e8f0')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
        >
          ✕
        </button>
      </div>

      {/* Expand technical details (dev mode) */}
      {error.message && error.message !== error.userMessage && (
        <div>
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '0',
              textDecoration: 'underline',
            }}
          >
            {expanded ? 'Hide' : 'Show'} technical details
          </button>
          {expanded && (
            <pre
              style={{
                marginTop: '6px',
                padding: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '120px',
                overflow: 'auto',
              }}
            >
              {error.message}
            </pre>
          )}
        </div>
      )}

      {/* Not recoverable pill */}
      {!error.isRecoverable && (
        <span
          style={{
            alignSelf: 'flex-start',
            fontSize: '10px',
            color: '#fbbf24',
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '999px',
            padding: '2px 8px',
          }}
        >
          Action required
        </span>
      )}
    </div>
  )
}

// ── Toast Container ───────────────────────────────────────────────────────────
export function ErrorToast() {
  const { errors, removeError } = useErrorContext()

  if (errors.length === 0) return null

  return (
    <div
      id="error-toast-container"
      aria-label="Error notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {errors.map((error) => (
        <div key={error.id} style={{ pointerEvents: 'all' }}>
          <Toast error={error} onDismiss={() => error.id && removeError(error.id)} />
        </div>
      ))}
    </div>
  )
}

export default ErrorToast
