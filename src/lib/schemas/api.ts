/**
 * Zod schemas for API route validation
 */

import { z } from "zod";

/**
 * Newsletter subscription schema
 */
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .min(3, "Email is too short")
    .max(320, "Email is too long")
    .email("Invalid email address")
    .transform((e) => e.toLowerCase().trim()),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

/**
 * Provider search query parameters schema
 */
export const providerSearchSchema = z.object({
  q: z.string().max(100, "Search query too long").optional(),
  state: z
    .string()
    .length(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be uppercase 2-letter code")
    .optional(),
  city: z.string().max(100, "City name too long").optional(),
  zip: z
    .string()
    .regex(/^\d{5}$/, "ZIP code must be 5 digits")
    .optional(),
  specialization: z.string().max(200, "Specialization filter too long").optional(),
  gender: z.enum(["M", "F"]).optional(),
  acceptingOnly: z.enum(["true", "false"]).optional(),
  telehealthOnly: z.enum(["true", "false"]).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .optional()
    .default(20),
  offset: z.coerce
    .number()
    .int()
    .min(0, "Offset must be 0 or greater")
    .optional()
    .default(0),
});

export type ProviderSearchInput = z.infer<typeof providerSearchSchema>;
