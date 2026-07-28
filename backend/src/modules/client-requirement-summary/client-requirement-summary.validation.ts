import { z } from "zod";
import { consultationModeSchema } from "../../shared/constants/consultation-mode.js";

const conversationTurnSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
});

export const generateClientSummarySchema = z.object({
  consultationMode: consultationModeSchema,
  projectIdea: z.string().trim().min(1, "Project idea is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  otherPlatform: z.string().trim().optional(),
  conversation: z.array(conversationTurnSchema).min(1, "Discovery conversation is required"),
});

export type GenerateClientSummaryInput = z.infer<typeof generateClientSummarySchema>;
