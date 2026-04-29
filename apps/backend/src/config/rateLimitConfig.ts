export const TIER_LIMITS = {
  anonymous: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Anonymous limit reached (5 req / 15 min). Please sign in for more.',
  },
  verified: {
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Verified user limit reached (15 req / 15 min). Upgrade to Premium for more.',
  },
  premium: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Premium tier limit reached (50 req / 15 min).',
  },
}

export const AI_GENERATION_LIMITS = {
  anonymous: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Anonymous: daily AI generation limit reached (1 image). Sign in for more.',
  },
  verified: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    message: 'Verified user: daily AI generation limit reached (5 images).',
  },
  premium: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 20,
    message: 'Premium tier: daily AI generation limit reached (20 images).',
  },
}

export const AUTH_LIMITS = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts. Please try again in a minute.',
}
