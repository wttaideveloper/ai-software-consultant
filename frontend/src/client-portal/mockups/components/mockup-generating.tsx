import { LayoutGrid, Palette, ScanSearch, Wand2 } from "lucide-react";
import { AiGenerationLoader } from "@/client-portal/components/ai-generation-loader";

/**
 * Cinematic "AI is designing your screens" state, shown while a mockup batch is in
 * flight. Delegates to the shared AiGenerationLoader so the estimate and the
 * concept step feel like one AI product. The steps mirror the real pipeline (plan
 * the screens, then render them); image rendering is the slow stage, so the copy
 * sets that expectation.
 */
export function MockupGenerating() {
  return (
    <AiGenerationLoader
      title="Designing your visual concepts…"
      caption="This takes a little longer than the estimate — your estimate is already final."
      stepDurationMs={2200}
      steps={[
        { icon: ScanSearch, label: "Analysing your requirements" },
        { icon: LayoutGrid, label: "Planning your app screens" },
        { icon: Palette, label: "Designing concept mockups" },
        { icon: Wand2, label: "Adding modern UI styles" },
      ]}
    />
  );
}
