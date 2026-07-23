import { asc, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { organizations } from "../../db/schema/index.js";

/**
 * The Client Portal is public and stateless — there is no authenticated visitor,
 * so a request carries no organization of its own. Pricing needs a rate card, and
 * a rate card is org-scoped, so the portal prices against the platform owner: the
 * earliest non-deleted organization.
 *
 * That is the same single-tenant resolution admin.seed.ts uses ("this platform is
 * internal and single-tenant now, so a second organization would silently split
 * the data") — deliberately reused so the price a visitor sees is built from the
 * exact rate card an admin edits in Cost Settings.
 */
export class ClientEstimateRepository {
  async findPortalOrganizationId(
    executor: DbExecutor = db,
  ): Promise<string | null> {
    const [org] = await executor
      .select({ id: organizations.id })
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(asc(organizations.createdAt))
      .limit(1);

    return org?.id ?? null;
  }
}

export const clientEstimateRepository = new ClientEstimateRepository();
