import type { Request } from "express";

/**
 * Best-effort caller IP, used for audit rows and per-IP rate limiting.
 *
 * Prefers the first entry of `x-forwarded-for` (the original client when the app
 * sits behind a proxy or load balancer) and falls back to the socket address.
 * Spoofable by definition, so it is only ever a soft signal — never an
 * authorization input.
 */
export function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return req.ip ?? null;
}
