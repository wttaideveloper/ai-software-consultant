import { z } from "zod";

const conversationTurnSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
});

export const startClientDiscoverySchema = z.object({
  projectIdea: z.string().trim().min(1, "Project idea is required"),
  consultationTime: z.string().trim().min(1, "Consultation time is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  otherPlatform: z.string().trim().optional(),
});

export const nextClientDiscoverySchema = z.object({
  projectIdea: z.string().trim().min(1, "Project idea is required"),
  consultationTime: z.string().trim().min(1, "Consultation time is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  otherPlatform: z.string().trim().optional(),
  conversation: z.array(conversationTurnSchema).min(1, "Conversation history is required"),
  currentAnswer: z.string().trim().min(1, "An answer is required"),
});

export type StartClientDiscoveryInput = z.infer<typeof startClientDiscoverySchema>;
export type NextClientDiscoveryInput = z.infer<typeof nextClientDiscoverySchema>;

export const aiDiscoveryPayloadSchema = z.object({
  question: z.string().nullable(),
  completed: z.boolean(),
});
