import { db, type DbExecutor } from "../../db/index.js";
import { clientLeads } from "../../db/schema/index.js";
import type { CreateClientLeadInput } from "./client-lead.validation.js";

export type ClientLeadRecord = typeof clientLeads.$inferSelect;

export class ClientLeadRepository {
  async create(
    data: CreateClientLeadInput,
    executor: DbExecutor = db,
  ): Promise<ClientLeadRecord> {
    const [lead] = await executor
      .insert(clientLeads)
      .values({
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        country: data.country ?? null,
        preferredContactMethod: data.preferredContactMethod,
        notes: data.notes ?? null,
        projectIdea: data.projectIdea,
        consultationTime: data.consultationTime,
        platforms: data.platforms,
        otherPlatform: data.otherPlatform ?? null,
        requirementSummary: data.requirementSummary,
        features: data.features,
        estimate: data.estimate,
      })
      .returning();

    if (!lead) {
      throw new Error("Failed to create client lead");
    }

    return lead;
  }
}

export const clientLeadRepository = new ClientLeadRepository();
