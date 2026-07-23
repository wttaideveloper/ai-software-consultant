import { and, asc, count, eq, gte, isNull, sql } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { clientMockupImages, clientMockupSets } from "../../db/schema/index.js";

export type ClientMockupSetRecord = typeof clientMockupSets.$inferSelect;
export type ClientMockupImageRecord = typeof clientMockupImages.$inferSelect;

export type CreateMockupImageData = {
  setId: string;
  screenName: string;
  description: string;
  sortOrder: number;
  storageKey: string;
  mimeType: string;
};

export class ClientMockupsRepository {
  async runInTransaction<T>(callback: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  async findSetByConsultationKey(
    consultationKey: string,
    executor: DbExecutor = db,
  ): Promise<ClientMockupSetRecord | null> {
    const [record] = await executor
      .select()
      .from(clientMockupSets)
      .where(
        and(
          eq(clientMockupSets.consultationKey, consultationKey),
          isNull(clientMockupSets.deletedAt),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async findImagesBySetId(
    setId: string,
    executor: DbExecutor = db,
  ): Promise<ClientMockupImageRecord[]> {
    return executor
      .select()
      .from(clientMockupImages)
      .where(eq(clientMockupImages.setId, setId))
      .orderBy(asc(clientMockupImages.sortOrder));
  }

  async findImageById(
    imageId: string,
    executor: DbExecutor = db,
  ): Promise<ClientMockupImageRecord | null> {
    const [record] = await executor
      .select()
      .from(clientMockupImages)
      .where(eq(clientMockupImages.id, imageId))
      .limit(1);

    return record ?? null;
  }

  /**
   * Claims the right to generate for this key.
   *
   * `onConflictDoNothing` on the unique consultation key is what makes this safe
   * under concurrency: two simultaneous POSTs both attempt the insert, exactly one
   * wins, and the loser gets null and reads the winner's row instead of starting a
   * second (billable) batch. This is the durable, cross-instance guard — unlike the
   * in-memory rate limiter, it holds no matter how many processes are running.
   */
  async claimSet(
    data: { consultationKey: string; requirementsHash: string },
    executor: DbExecutor = db,
  ): Promise<ClientMockupSetRecord | null> {
    const [record] = await executor
      .insert(clientMockupSets)
      .values({
        consultationKey: data.consultationKey,
        requirementsHash: data.requirementsHash,
        status: "PENDING",
      })
      .onConflictDoNothing({ target: clientMockupSets.consultationKey })
      .returning();

    return record ?? null;
  }

  /**
   * Flips an existing set back to PENDING for a regenerate, but only from a
   * settled state. The `status <> 'PENDING'` predicate means a regenerate that
   * races an in-flight batch changes nothing and returns null, so a user mashing
   * the button cannot stack generations.
   */
  async reclaimSetForRegeneration(
    data: { consultationKey: string; requirementsHash: string; maxGenerations: number },
    executor: DbExecutor = db,
  ): Promise<ClientMockupSetRecord | null> {
    const [record] = await executor
      .update(clientMockupSets)
      .set({
        status: "PENDING",
        requirementsHash: data.requirementsHash,
        error: null,
        generationCount: sql`${clientMockupSets.generationCount} + 1`,
      })
      .where(
        and(
          eq(clientMockupSets.consultationKey, data.consultationKey),
          isNull(clientMockupSets.deletedAt),
          sql`${clientMockupSets.status} <> 'PENDING'`,
          // The ceiling is enforced in the UPDATE predicate, not read-then-write,
          // so two racing regenerate clicks can never both pass a stale check.
          sql`${clientMockupSets.generationCount} < ${data.maxGenerations}`,
        ),
      )
      .returning();

    return record ?? null;
  }

  async markSetReady(setId: string, executor: DbExecutor = db): Promise<void> {
    await executor
      .update(clientMockupSets)
      .set({ status: "READY", error: null })
      .where(eq(clientMockupSets.id, setId));
  }

  async markSetFailed(
    setId: string,
    error: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(clientMockupSets)
      .set({ status: "FAILED", error })
      .where(eq(clientMockupSets.id, setId));
  }

  async deleteImagesBySetId(setId: string, executor: DbExecutor = db): Promise<void> {
    await executor.delete(clientMockupImages).where(eq(clientMockupImages.setId, setId));
  }

  async createImages(
    data: CreateMockupImageData[],
    executor: DbExecutor = db,
  ): Promise<void> {
    if (data.length === 0) return;
    await executor.insert(clientMockupImages).values(data);
  }

  /**
   * Batches started since `since`, across every visitor — the global spend ceiling.
   * Counts sets by creation, so regenerations (which reuse a row) are counted via
   * the separate per-key allowance rather than here.
   */
  async countSetsCreatedSince(since: Date, executor: DbExecutor = db): Promise<number> {
    const [row] = await executor
      .select({ value: count() })
      .from(clientMockupSets)
      .where(gte(clientMockupSets.createdAt, since));

    return row?.value ?? 0;
  }
}

export const clientMockupsRepository = new ClientMockupsRepository();
