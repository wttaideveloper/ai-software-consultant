import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  country: z.string().trim().optional(),
  preferredContactMethod: z.enum(["EMAIL", "PHONE", "WHATSAPP"]),
  notes: z.string().trim().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
