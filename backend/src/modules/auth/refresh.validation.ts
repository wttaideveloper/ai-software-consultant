import { z } from "zod";

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1, "Refresh token is required"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
