import { AI_ROLES } from "../ai/ai.constants.js";
import type { AIMessage, AIRequest } from "../ai/ai.types.js";
import {
  PROMPT_DEFAULTS,
  PROMPT_TYPES,
  RESERVED_TEMPLATE_VARIABLES,
  type PromptType,
} from "./prompt.constants.js";
import type {
  BuiltPrompt,
  ConsultationPromptContext,
  ConversationPromptMessage,
  OrganizationPromptContext,
  PromptBuildInput,
  TemplateVariables,
} from "./prompt.types.js";

const SYSTEM_PROMPT_TEMPLATES: Record<PromptType, string> = {
  [PROMPT_TYPES.CONSULTATION]:
    "You are an expert software consultant for {{organizationName}}. Guide the discovery conversation for project \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Budget range: {{budgetRange}}. Timeline: {{timeline}}. Ask clarifying questions, stay professional, and avoid inventing requirements.",
  // PLACEHOLDER: prompt type registered ahead of Phase 1 wiring; not yet used
  // for any real AI call. The final extraction prompt is a later step.
  [PROMPT_TYPES.REQUIREMENT_EXTRACTION]:
    "PLACEHOLDER: requirement extraction prompt not yet implemented.",
  [PROMPT_TYPES.FEATURE_DETECTION]:
    "You are a product analyst for {{organizationName}}. Extract software features from the requirement summary for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"features\":[{\"name\":\"\",\"category\":\"\",\"description\":\"\",\"priority\":\"HIGH|MEDIUM|LOW\",\"complexity\":\"LOW|MEDIUM|HIGH\",\"confidence\":0.0,\"reasoning\":\"\"}]}. confidence must be between 0 and 1. Do not invent unsupported features.",
  [PROMPT_TYPES.FEATURE_MATCHING]:
    "You are a feature matching specialist for {{organizationName}}. Match detected consultation features to reusable feature library templates for \"{{consultationTitle}}\". Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"matches\":[{\"detectedFeatureId\":\"\",\"libraryFeatureId\":\"\",\"confidence\":0.0,\"recommendation\":\"\"}]}. libraryFeatureId must be an existing library feature id or null when no good match exists. confidence must be between 0 and 1. Do not invent library features or modify detected features.",
  [PROMPT_TYPES.REQUIREMENT_SUMMARY]:
    "You are a requirements analyst for {{organizationName}}. Analyze the consultation conversation for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"summaryMarkdown\":\"string\",\"structuredSummary\":{\"projectName\":\"\",\"projectType\":\"\",\"businessGoals\":[],\"targetUsers\":[],\"coreFeatures\":[],\"adminFeatures\":[],\"integrations\":[],\"nonFunctionalRequirements\":[],\"assumptions\":[],\"openQuestions\":[]}}. summaryMarkdown must be a complete markdown requirements document. Do not invent facts not supported by the conversation.",
  [PROMPT_TYPES.ESTIMATION]:
    "You are a software estimation specialist for {{organizationName}}. Produce effort estimates for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Timeline: {{timeline}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"estimatedHours\":0,\"estimatedWeeks\":0,\"teamSize\":0,\"complexity\":\"LOW|MEDIUM|HIGH\",\"confidence\":0.0,\"assumptions\":[],\"risks\":[],\"breakdown\":[{\"category\":\"\",\"hours\":0}]}. confidence must be between 0 and 1. Base estimates only on the provided requirement summary and detected features.",
  [PROMPT_TYPES.PROPOSAL]:
    "You are a proposal writer for {{organizationName}}. Draft a client-ready software proposal for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Timeline: {{timeline}}. Budget range: {{budgetRange}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"title\":\"\",\"executiveSummary\":\"\",\"scopeOfWork\":[],\"deliverables\":[],\"timeline\":\"\",\"assumptions\":[],\"exclusions\":[],\"pricingNotes\":\"\",\"proposalMarkdown\":\"\"}. proposalMarkdown must never be empty: it is a complete, standalone client-facing markdown document (with headings) that restates the title, executive summary, scope of work, deliverables, timeline, assumptions, exclusions, and pricing notes in full prose. assumptions and exclusions must each contain at least one item; if none are notable, include a single explicit entry such as \"No additional assumptions beyond the requirement summary.\" or \"No exclusions beyond the defined scope of work.\". Base the proposal only on the provided requirement summary, detected features, and estimation. Do not invent unsupported scope.",
  [PROMPT_TYPES.EMAIL]:
    "You are a professional communications assistant for {{organizationName}}. Draft a clear, concise email related to consultation \"{{consultationTitle}}\". Keep tone professional and actionable.",
  [PROMPT_TYPES.MEETING_SUMMARY]:
    "You are a meeting summarizer for {{organizationName}}. Produce a structured summary for consultation \"{{consultationTitle}}\" with decisions, action items, and next steps.",
};

const USER_PROMPT_TEMPLATES: Record<PromptType, string> = {
  [PROMPT_TYPES.CONSULTATION]: "{{userMessage}}",
  [PROMPT_TYPES.REQUIREMENT_EXTRACTION]: "{{userMessage}}",
  [PROMPT_TYPES.FEATURE_DETECTION]:
    "Detect software features from this requirement summary:\n\n{{userMessage}}",
  [PROMPT_TYPES.FEATURE_MATCHING]:
    "Match these detected features to the feature library templates:\n\n{{userMessage}}",
  [PROMPT_TYPES.REQUIREMENT_SUMMARY]:
    "Create a requirement summary from this consultation conversation:\n\n{{userMessage}}",
  [PROMPT_TYPES.ESTIMATION]:
    "Generate a project effort estimation from this requirement summary and detected features:\n\n{{userMessage}}",
  [PROMPT_TYPES.PROPOSAL]:
    "Generate a professional software proposal from this requirement summary, detected features, and estimation:\n\n{{userMessage}}",
  [PROMPT_TYPES.EMAIL]:
    "Draft an email based on:\n\n{{userMessage}}",
  [PROMPT_TYPES.MEETING_SUMMARY]:
    "Summarize the meeting notes:\n\n{{userMessage}}",
};

export class PromptBuilder {
  buildSystemPrompt(
    promptType: PromptType,
    variables: TemplateVariables = {},
  ): string {
    return this.applyTemplate(SYSTEM_PROMPT_TEMPLATES[promptType], variables);
  }

  buildUserPrompt(
    promptType: PromptType,
    variables: TemplateVariables = {},
  ): string {
    return this.applyTemplate(USER_PROMPT_TEMPLATES[promptType], variables);
  }

  injectOrganizationContext(
    organization: OrganizationPromptContext | undefined,
    variables: TemplateVariables = {},
  ): TemplateVariables {
    if (!organization) {
      return { ...variables };
    }

    return {
      ...variables,
      [RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_ID]: organization.id,
      [RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME]: organization.name,
    };
  }

  injectConsultationContext(
    consultation: ConsultationPromptContext | undefined,
    variables: TemplateVariables = {},
  ): TemplateVariables {
    if (!consultation) {
      return { ...variables };
    }

    return {
      ...variables,
      [RESERVED_TEMPLATE_VARIABLES.CONSULTATION_ID]: consultation.id,
      [RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE]: consultation.title,
      [RESERVED_TEMPLATE_VARIABLES.INDUSTRY]: consultation.industry ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE]:
        consultation.projectType ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE]:
        consultation.budgetRange ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.TIMELINE]: consultation.timeline ?? "unspecified",
    };
  }

  injectConversationHistory(
    history: ConversationPromptMessage[] | undefined,
    maxHistory: number = PROMPT_DEFAULTS.MAX_CONVERSATION_HISTORY,
  ): AIMessage[] {
    if (!history || history.length === 0) {
      return [];
    }

    const trimmed = history.slice(-maxHistory);

    return trimmed.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  buildMessages(input: {
    systemPrompt: string;
    userPrompt: string;
    conversationHistory?: ConversationPromptMessage[];
    maxHistory?: number;
  }): AIMessage[] {
    const historyMessages = this.injectConversationHistory(
      input.conversationHistory,
      input.maxHistory ?? PROMPT_DEFAULTS.MAX_CONVERSATION_HISTORY,
    );

    const messages: AIMessage[] = [
      {
        role: AI_ROLES.SYSTEM,
        content: input.systemPrompt,
      },
      ...historyMessages,
      {
        role: AI_ROLES.USER,
        content: input.userPrompt,
      },
    ];

    return messages;
  }

  build(input: PromptBuildInput): BuiltPrompt {
    let variables = this.injectOrganizationContext(
      input.organization,
      input.variables ?? {},
    );
    variables = this.injectConsultationContext(input.consultation, variables);
    variables = {
      ...variables,
      [RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME]:
        variables[RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME] ??
        "the organization",
      [RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE]:
        variables[RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE] ??
        "the consultation",
      [RESERVED_TEMPLATE_VARIABLES.INDUSTRY]:
        variables[RESERVED_TEMPLATE_VARIABLES.INDUSTRY] ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE]:
        variables[RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE] ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE]:
        variables[RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE] ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.TIMELINE]:
        variables[RESERVED_TEMPLATE_VARIABLES.TIMELINE] ?? "unspecified",
      [RESERVED_TEMPLATE_VARIABLES.USER_MESSAGE]: input.userMessage,
    };

    const systemPrompt = this.buildSystemPrompt(input.promptType, variables);
    const userPrompt = this.buildUserPrompt(input.promptType, variables);
    const messages = this.buildMessages({
      systemPrompt,
      userPrompt,
      conversationHistory: input.conversationHistory,
    });

    const request: AIRequest = {
      model: input.model,
      messages,
      systemPrompt,
      maxTokens: input.maxTokens ?? input.model.maxTokens,
      temperature: input.temperature ?? input.model.temperature,
      metadata: {
        promptType: input.promptType,
        ...input.metadata,
      },
    };

    return {
      systemPrompt,
      userPrompt,
      messages,
      request,
    };
  }

  applyTemplate(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = variables[key];

      if (value === null || value === undefined) {
        return "";
      }

      return String(value);
    });
  }
}

export const promptBuilder = new PromptBuilder();
