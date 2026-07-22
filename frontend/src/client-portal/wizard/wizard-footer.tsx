import type { ReactNode } from "react";

type WizardFooterProps = {
  children: ReactNode;
};

/** Visual footer bar every wizard step renders its WizardNavigation buttons inside. */
export function WizardFooter({ children }: WizardFooterProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
      {children}
    </div>
  );
}
