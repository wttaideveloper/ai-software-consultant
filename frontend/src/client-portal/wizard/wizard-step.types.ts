/** A single step in a generic multi-step wizard. Purely data — the wizard shell never hardcodes a step count. */
export type WizardStepDefinition = {
  id: string;
  /** Path segment relative to the wizard's basePath, e.g. "project-idea". */
  path: string;
  label: string;
};
