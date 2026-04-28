import crypto from 'crypto'

export interface FeatureFlagEvaluationContext {
  userId?: string
  sessionId?: string
  ip?: string
}

export interface FeatureFlagMetadata {
  enabled: boolean
  source: 'override' | 'global' | 'rollout' | 'disabled'
  rolloutPercentage?: number
}

function normalizeFlagName(flagName: string): string {
  return flagName.trim().toLowerCase()
}

function parseFeatureFlagNames(value?: string): Set<string> {
  if (!value) {
    return new Set()
  }

  return new Set(
    value
      .split(',')
      .map((flag) => normalizeFlagName(flag))
      .filter(Boolean)
  )
}

function parseRolloutConfig(value?: string): Record<string, number> {
  const rollouts: Record<string, number> = {}
  if (!value) {
    return rollouts
  }

  value.split(',').forEach((entry) => {
    const [rawName, rawPercent] = entry.split(':').map((v) => v.trim())
    const name = normalizeFlagName(rawName)
    const percent = Number(rawPercent)

    if (!name || Number.isNaN(percent)) {
      return
    }

    rollouts[name] = Math.min(100, Math.max(0, percent))
  })

  return rollouts
}

function parseOverrideConfig(value?: string): Record<string, boolean> {
  const overrides: Record<string, boolean> = {}
  if (!value) {
    return overrides
  }

  value.split(',').forEach((entry) => {
    const [rawName, rawValue] = entry.split(':').map((v) => v.trim())
    const name = normalizeFlagName(rawName)
    if (!name || rawValue === undefined) {
      return
    }

    overrides[name] = rawValue.toLowerCase() === 'true'
  })

  return overrides
}

function getStableKey(context: FeatureFlagEvaluationContext): string {
  return context.userId || context.sessionId || context.ip || 'anonymous'
}

function computePercentageFromKey(stableKey: string): number {
  const hash = crypto.createHash('sha256').update(stableKey).digest()
  return hash.readUInt32BE(0) % 100
}

export function getFeatureFlagConfig() {
  return {
    globalFlags: parseFeatureFlagNames(process.env.FEATURE_FLAGS),
    rollouts: parseRolloutConfig(process.env.FEATURE_FLAG_ROLLOUTS),
    overrides: parseOverrideConfig(process.env.FEATURE_FLAG_OVERRIDES),
  }
}

export function getFeatureFlagMetadata(
  featureName: string,
  context: FeatureFlagEvaluationContext = {}
): FeatureFlagMetadata {
  const normalizedName = normalizeFlagName(featureName)
  const { globalFlags, rollouts, overrides } = getFeatureFlagConfig()
  const rolloutPercentage = rollouts[normalizedName]

  if (Object.prototype.hasOwnProperty.call(overrides, normalizedName)) {
    return {
      enabled: overrides[normalizedName],
      source: 'override',
      rolloutPercentage,
    }
  }

  if (globalFlags.has(normalizedName)) {
    return {
      enabled: true,
      source: 'global',
      rolloutPercentage,
    }
  }

  if (rolloutPercentage !== undefined) {
    if (rolloutPercentage >= 100) {
      return {
        enabled: true,
        source: 'rollout',
        rolloutPercentage,
      }
    }

    if (rolloutPercentage <= 0) {
      return {
        enabled: false,
        source: 'disabled',
        rolloutPercentage,
      }
    }

    const stableKey = `${normalizedName}:${getStableKey(context)}`
    const bucket = computePercentageFromKey(stableKey)
    return {
      enabled: bucket < rolloutPercentage,
      source: 'rollout',
      rolloutPercentage,
    }
  }

  return {
    enabled: false,
    source: 'disabled',
    rolloutPercentage,
  }
}

export function isFeatureEnabled(
  featureName: string,
  context: FeatureFlagEvaluationContext = {}
): boolean {
  return getFeatureFlagMetadata(featureName, context).enabled
}

export function getFeatureFlagsForRequest(
  context: FeatureFlagEvaluationContext = {}
): Record<string, boolean> {
  const { globalFlags, rollouts, overrides } = getFeatureFlagConfig()
  const names = new Set<string>([
    ...globalFlags,
    ...Object.keys(rollouts),
    ...Object.keys(overrides),
  ])

  const result: Record<string, boolean> = {}
  names.forEach((name) => {
    result[name] = isFeatureEnabled(name, context)
  })

  return result
}

export function getAllFeatureFlagMetadata(
  context: FeatureFlagEvaluationContext = {}
): Record<string, FeatureFlagMetadata> {
  const { globalFlags, rollouts, overrides } = getFeatureFlagConfig()
  const names = new Set<string>([
    ...globalFlags,
    ...Object.keys(rollouts),
    ...Object.keys(overrides),
  ])

  const result: Record<string, FeatureFlagMetadata> = {}
  names.forEach((name) => {
    result[name] = getFeatureFlagMetadata(name, context)
  })

  return result
}
