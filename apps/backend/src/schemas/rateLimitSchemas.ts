import { z } from 'zod';

export const getUserListSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    tier: z.enum(['anonymous', 'verified', 'premium', 'all']).default('all'),
    search: z.string().optional()
  })
});

export const updateUserTierSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    tier: z.enum(['verified', 'premium'], {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_enum_value) {
          return { message: 'Tier must be either "verified" or "premium"' };
        }
        return { message: ctx.defaultError };
      }
    })
  })
});

export const resetUserRateLimitsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  query: z.object({
    limitType: z.enum(['standard', 'ai', 'all']).default('all')
  })
});

export const getUserRateLimitStatusSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  })
});

export const rateLimitStatsSchema = z.object({
  query: z.object({
    detailed: z.coerce.boolean().default(false)
  })
});

export type GetUserListRequest = z.infer<typeof getUserListSchema>['query'];
export type UpdateUserTierRequest = z.infer<typeof updateUserTierSchema>['body'];
export type ResetUserRateLimitsRequest = z.infer<typeof resetUserRateLimitsSchema>['query'];
export type RateLimitStatsRequest = z.infer<typeof rateLimitStatsSchema>['query'];
