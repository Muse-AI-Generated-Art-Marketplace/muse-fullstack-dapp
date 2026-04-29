import { isFeatureEnabled, getFeatureFlagsForRequest } from '@/config/featureFlags'

describe('Feature flag system', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.FEATURE_FLAGS
    delete process.env.FEATURE_FLAG_ROLLOUTS
    delete process.env.FEATURE_FLAG_OVERRIDES
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('global flags are enabled for all users', () => {
    process.env.FEATURE_FLAGS = 'new-ui,beta-flow'

    expect(isFeatureEnabled('new-ui')).toBe(true)
    expect(isFeatureEnabled('beta-flow')).toBe(true)
    expect(isFeatureEnabled('unknown-feature')).toBe(false)
  })

  test('rollout percentage is stable and deterministic', () => {
    process.env.FEATURE_FLAG_ROLLOUTS = 'early-access:50,all-users:100'

    const first = isFeatureEnabled('early-access', { userId: 'test-user' })
    const second = isFeatureEnabled('early-access', { userId: 'test-user' })

    expect(first).toBe(second)
    expect(isFeatureEnabled('all-users', { userId: 'test-user' })).toBe(true)
  })

  test('overrides take precedence over global and rollout configs', () => {
    process.env.FEATURE_FLAGS = 'new-ui'
    process.env.FEATURE_FLAG_ROLLOUTS = 'new-ui:0,experimental:100'
    process.env.FEATURE_FLAG_OVERRIDES = 'new-ui:false,experimental:false'

    expect(isFeatureEnabled('new-ui')).toBe(false)
    expect(isFeatureEnabled('experimental')).toBe(false)
  })

  test('middleware exposes computed feature flags', () => {
    process.env.FEATURE_FLAGS = 'gold-badge'
    process.env.FEATURE_FLAG_ROLLOUTS = 'early-access:100'

    const flags = getFeatureFlagsForRequest({ userId: 'user-1', ip: '127.0.0.1' })

    expect(flags['gold-badge']).toBe(true)
    expect(flags['early-access']).toBe(true)
  })
})
