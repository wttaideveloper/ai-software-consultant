import { z } from "zod";
import { TECH_STACK_LIMITS } from "./tech-stack.constants.js";
import { TECH_STACK_CATEGORIES } from "./tech-stack.types.js";

/**
 * Wire schemas for the grouped technology stack.
 *
 * Every one of them is permissive by design. A technology stack is descriptive
 * data, never a decision the system acts on, so rejecting a request because a
 * cached client sent last week's shape would be a self-inflicted outage — the
 * engine's normaliser is what guarantees the shape instead.
 */

export const techStackGroupSchema = z.object({
  category: z.enum(TECH_STACK_CATEGORIES),
  /**
   * Optional on input, always present on output: the engine re-derives it from
   * the canonical label table, so a client cannot relabel a category and a
   * snapshot written before labels existed still validates.
   */
  label: z.string().trim().max(80).optional(),
  items: z
    .array(z.string().trim().min(1).max(TECH_STACK_LIMITS.MAX_ITEM_LENGTH))
    .max(TECH_STACK_LIMITS.MAX_ITEMS_PER_GROUP),
});

export const techStackGroupsSchema = z
  .array(techStackGroupSchema)
  .max(Object.keys(TECH_STACK_CATEGORIES).length);

/**
 * The backwards-compatible input: either the legacy flat `string[]` an older
 * client (or an older stored record) sends, or the grouped structure. Callers
 * pass whichever they get straight to `normalizeTechStack`.
 */
export const techStackInputSchema = z.union([
  z.array(z.string().trim().max(TECH_STACK_LIMITS.MAX_ITEM_LENGTH)),
  techStackGroupsSchema,
]);

export type TechStackGroupInput = z.infer<typeof techStackGroupSchema>;
export type TechStackInput = z.infer<typeof techStackInputSchema>;
