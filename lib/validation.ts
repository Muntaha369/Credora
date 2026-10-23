import { z } from "zod";

export const issueCredentialSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(1, "Recipient name or public ID is required")
    .max(100, "Recipient name must not exceed 100 characters"),
  achievementTitle: z
    .string()
    .trim()
    .min(1, "Achievement / course title is required")
    .max(150, "Achievement title must not exceed 150 characters"),
  issuingOrganization: z
    .string()
    .trim()
    .min(1, "Issuing organization is required")
    .max(100, "Issuing organization must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .default(""),
});

export const revokeCredentialSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(250, "Revocation reason must not exceed 250 characters")
    .optional()
    .default("Revoked by authorized issuer"),
});

export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>;
export type RevokeCredentialInput = z.infer<typeof revokeCredentialSchema>;
