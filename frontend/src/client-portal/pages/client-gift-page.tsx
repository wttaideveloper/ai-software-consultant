import { CheckCircle2, Mail } from "lucide-react";
import { ClientLayout } from "@/client-portal/layouts/client-layout";

export function ClientGiftPage() {
  return (
    <ClientLayout>
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle">
          <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Proposal request sent!
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          We've received your project details and will be in touch with a tailored proposal shortly.
        </p>

        <div className="mt-8 w-full max-w-sm rounded-xl border border-border bg-canvas p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
              <Mail className="h-4 w-4 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <p className="mt-1 text-sm text-muted">
                Our team will review your requirements and reach out via your preferred contact
                method within 1–2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
