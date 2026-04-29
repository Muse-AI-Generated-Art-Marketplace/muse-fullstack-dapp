export const TIER_LIMITS = {
  anonymous: {
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Anonymous limit reached (30 req / 15 min). Please sign in for more.',
  },
  free: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Free tier limit reached (100 req / 15 min). Upgrade to Pro for more.',
  },
  pro: {
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Pro tier limit reached (500 req / 15 min).',
  },
  premium: {
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: 'Premium tier limit reached (2000 req / 15 min).',
  },
}

export const AI_GENERATION_LIMITS = {
  anonymous: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Anonymous: daily AI generation limit reached (1 image). Sign in for more.',
  },
  free: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    message: 'Free tier: daily AI generation limit reached (5 images).',
  },
  pro: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 50,
    message: 'Pro tier: daily AI generation limit reached (50 images).',
  },
  premium: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 500,
    message: 'Premium tier: daily AI generation limit reached (500 images).',
  },
}

export const AUTH_LIMITS = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts. Please try again in a minute.',
}
