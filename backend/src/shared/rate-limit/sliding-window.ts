/**
 * Minimal in-memory sliding-window counter.
 *
 * Deliberately not a new dependency: the only caller is the concept-mockup
 * endpoint, and pulling in express-rate-limit to guard one route would add a
 * middleware stack this codebase does not otherwise use.
 *
 * **Scope, honestly stated:** this is per-process. With more than one backend
 * instance each gets its own window, so the effective limit multiplies by the
 * instance count. That is acceptable here because it is the *second* line of
 * defence — the durable, cross-instance caps are the unique consultation key and
 * the daily budget, both of which are enforced in Postgres. If this ever needs to
 * be exact across instances, replace the map with a Redis counter; the interface
 * is small on purpose.
 */
export class SlidingWindowCounter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxHits: number,
  ) {}

  /**
   * Records an attempt and reports whether it is allowed. Prunes as it goes, so
   * the map cannot grow without bound for keys that stop being used.
   */
  tryConsume(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((at) => at > cutoff);

    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);

    // Opportunistic sweep: without it, one-off keys would linger forever in a
    // long-running process.
    if (this.hits.size > 1_000) {
      for (const [existingKey, timestamps] of this.hits) {
        if (timestamps.every((at) => at <= cutoff)) {
          this.hits.delete(existingKey);
        }
      }
    }

    return true;
  }
}
