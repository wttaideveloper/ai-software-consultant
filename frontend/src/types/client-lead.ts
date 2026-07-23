/**
 * Admin-side view of a Client Portal submission (the `client_leads` table).
 *
 * The status union mirrors the `client_lead_status` pgEnum exactly. There is no
 * PROPOSAL_SENT member in the database — adding one needs a migration, so it is
 * deliberately absent here rather than being faked in the UI layer.
 */
export const CLIENT_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONVERTED",
  "CLOSED",
] as const;

export type ClientLeadStatus = (typeof CLIENT_LEAD_STATUSES)[number];

/** Row shape returned by GET /api/client-leads — list columns only. */
export type ClientLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  consultationTime: string;
  platforms: string[];
  otherPlatform: string | null;
  status: ClientLeadStatus;
  createdAt: string;
};

export type ListClientLeadsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ClientLeadStatus;
  /** ISO date (yyyy-mm-dd). Inclusive. */
  dateFrom?: string;
  /** ISO date (yyyy-mm-dd). Inclusive — the API widens it to end-of-day. */
  dateTo?: string;
};
