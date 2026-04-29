import { z } from "zod";

export const stellarAddressRegex = /^G[A-Z0-9]{55}$/;

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    bio: z.string().max(300).optional(),
    profileImage: z.string().url().optional(),
    bannerImage: z.string().url().optional(),
    website: z.string().url().optional(),
    twitter: z.string().max(50).optional(),
    discord: z.string().max(50).optional(),
  }),
  params: z.object({
    address: z
      .string()
      .regex(stellarAddressRegex, "Invalid Stellar address format"),
  }),
});

export const getProfileSchema = z.object({
  params: z.object({
    address: z
      .string()
      .regex(stellarAddressRegex, "Invalid Stellar address format"),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    preferences: z.object({
      notifications: z
        .object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
        })
        .optional(),
      privacy: z
        .object({
          profileVisibility: z.enum(["public", "private"]).optional(),
          showEmail: z.boolean().optional(),
        })
        .optional(),
    }),
  }),
  params: z.object({
    address: z
      .string()
      .regex(stellarAddressRegex, "Invalid Stellar address format"),
  }),
});

export const userActivitySchema = z.object({
  params: z.object({
    address: z
      .string()
      .regex(stellarAddressRegex, "Invalid Stellar address format"),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const leaderboardSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: z.enum(["followers", "created", "collected"]).default("followers"),
  }),
});
