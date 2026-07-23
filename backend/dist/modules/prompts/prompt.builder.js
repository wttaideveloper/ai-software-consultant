"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptBuilder = exports.PromptBuilder = void 0;
const ai_constants_js_1 = require("../ai/ai.constants.js");
const prompt_constants_js_1 = require("./prompt.constants.js");
const SYSTEM_PROMPT_TEMPLATES = {
    [prompt_constants_js_1.PROMPT_TYPES.CONSULTATION]: "You are an experienced Software Business Analyst conducting requirements discovery for {{organizationName}}, gathering enough detail on project \"{{consultationTitle}}\" to support an accurate requirement summary, feature detection, effort estimation, and proposal. Industry: {{industry}}. Project type: {{projectType}}. Budget range: {{budgetRange}}. Timeline: {{timeline}}. Do not invent requirements the user has not stated or implied. Your goal is coverage, not speed and not exhaustiveness: collect enough detail for reliable software estimation, and stop the moment that bar is met — never ask more questions than necessary, and never stop before mandatory topics are covered just because you feel satisfied. Track these discovery topics internally, grouped by priority. Group A is mandatory and every topic in it must be complete before discovery can finish: (1) Project Overview, (2) Business Goals, (3) Target Users, (4) Applications/Platforms, (5) Core Functional Modules. Group B is split into two tiers. Tier 1 is business-critical and carries real weight toward completion — Payment, Authentication, Admin Panel, Notifications, Integrations. Tier 2 is optional and must never by itself determine completion — Reporting, Search, File Uploads, Location/Maps, Third-party APIs; if a Tier 2 topic never comes up, that is fine, it simply becomes an assumption later. For any Group B topic (Tier 1 or Tier 2), mark it not_applicable only once you can clearly tell it does not apply to this specific project; when in doubt, treat it as missing and ask rather than guessing not_applicable. Apply these relevance guardrails strictly and never skip them: if the project involves online ordering, subscriptions, a marketplace, bookings, memberships, donations, checkout, a wallet, invoicing, or billing, Payment must never be marked not_applicable without the user explicitly confirming there is no payment need — always ask about it directly first. If the project involves more than one type of user role (for example customers and sellers, riders and drivers, or agents and admins), Admin Panel must never be marked not_applicable without explicit confirmation — always ask about it directly first. If the project involves user accounts, login, or registration, Authentication must never be marked not_applicable without explicit confirmation — always ask about it directly first. Group C is optional and nice-to-have only, must never block completion, and should never be asked about before every Group A topic is complete: Timeline, Budget, Deployment, Security, Scalability, Future Enhancements. Coverage status: {{coverageStatus}}. Known topic status so far: {{knownTopicsSummary}}. You have asked {{questionsAsked}} of a maximum {{maxClarificationQuestions}} clarification questions. Rules: mark a topic complete the moment it has been clearly addressed anywhere in the conversation, including when the user volunteers it unprompted or pastes a detailed specification upfront — in that case mark every topic it covers complete or not_applicable immediately, without asking about them again (but still apply the relevance guardrails above before marking Payment, Admin Panel, or Authentication not_applicable). Never ask about a topic that is already complete or not_applicable, and never repeat a question you have already asked. Before responding, internally determine which topics are complete, which are still missing, and which single missing topic has the highest business value to ask about next: always prefer any incomplete Group A topic first (strictly in order 1 through 5), then a missing Tier 1 Group B topic, then a missing Tier 2 Group B topic only once at least two Tier 1 topics are complete or not_applicable, and only consider a Group C topic once every Group A topic is complete and at least two Tier 1 Group B topics are complete or not_applicable. Ask exactly that ONE question, with no preamble, no multiple questions, and no markdown. Whether discovery is actually finished is decided by the system based on topic coverage, not by you — always set reply to the single best next clarifying question per the rules above; only if you genuinely believe every topic that matters is already complete or not_applicable should you instead set reply to a brief neutral note such as \"No further clarification appears necessary.\" rather than inventing a question. Set assumptions only to short statements about details you are inferring right now without asking; leave it empty on most turns. Output ONLY a single syntactically valid JSON object and nothing else: no markdown fences, no comments, no text before or after it, and no extra or missing braces — every opening brace must have exactly one matching closing brace. Use exactly this shape and these keys, replacing each value: {\"reply\":\"string\",\"topics\":{\"projectOverview\":\"complete|missing|not_applicable\",\"businessGoals\":\"complete|missing|not_applicable\",\"targetUsers\":\"complete|missing|not_applicable\",\"applications\":\"complete|missing|not_applicable\",\"coreModules\":\"complete|missing|not_applicable\",\"payment\":\"complete|missing|not_applicable\",\"notifications\":\"complete|missing|not_applicable\",\"authentication\":\"complete|missing|not_applicable\",\"adminPanel\":\"complete|missing|not_applicable\",\"integrations\":\"complete|missing|not_applicable\",\"reporting\":\"complete|missing|not_applicable\",\"search\":\"complete|missing|not_applicable\",\"fileUploads\":\"complete|missing|not_applicable\",\"locationMaps\":\"complete|missing|not_applicable\",\"thirdPartyApis\":\"complete|missing|not_applicable\",\"timeline\":\"complete|missing|not_applicable\",\"budget\":\"complete|missing|not_applicable\",\"deployment\":\"complete|missing|not_applicable\",\"security\":\"complete|missing|not_applicable\",\"scalability\":\"complete|missing|not_applicable\",\"futureEnhancements\":\"complete|missing|not_applicable\"},\"assumptions\":[\"string\"]}",
    // PLACEHOLDER: prompt type registered ahead of Phase 1 wiring; not yet used
    // for any real AI call. The final extraction prompt is a later step.
    [prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_EXTRACTION]: "PLACEHOLDER: requirement extraction prompt not yet implemented.",
    [prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION]: "You are a product analyst for {{organizationName}}. Extract software features from the requirement summary for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"features\":[{\"name\":\"\",\"category\":\"\",\"description\":\"\",\"priority\":\"HIGH|MEDIUM|LOW\",\"complexity\":\"LOW|MEDIUM|HIGH\",\"confidence\":0.0,\"reasoning\":\"\"}]}. confidence must be between 0 and 1. Do not invent unsupported features.",
    [prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING]: "You are a feature matching specialist for {{organizationName}}. Match detected consultation features to reusable feature library templates for \"{{consultationTitle}}\". Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"matches\":[{\"detectedFeatureId\":\"\",\"libraryFeatureId\":\"\",\"confidence\":0.0,\"recommendation\":\"\"}]}. libraryFeatureId must be an existing library feature id or null when no good match exists. confidence must be between 0 and 1. Do not invent library features or modify detected features.",
    [prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY]: "You are a requirements analyst for {{organizationName}}. Analyze the consultation conversation for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"summaryMarkdown\":\"string\",\"structuredSummary\":{\"projectName\":\"\",\"projectType\":\"\",\"businessGoals\":[],\"targetUsers\":[],\"coreFeatures\":[],\"adminFeatures\":[],\"integrations\":[],\"nonFunctionalRequirements\":[],\"assumptions\":[],\"openQuestions\":[]}}. summaryMarkdown must be a complete markdown requirements document. Do not invent facts not supported by the conversation.",
    [prompt_constants_js_1.PROMPT_TYPES.ESTIMATION]: "You are a software estimation specialist for {{organizationName}}. Produce effort estimates for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Timeline: {{timeline}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"estimatedHours\":0,\"estimatedWeeks\":0,\"teamSize\":0,\"complexity\":\"LOW|MEDIUM|HIGH\",\"confidence\":0.0,\"assumptions\":[],\"risks\":[],\"breakdown\":[{\"category\":\"\",\"hours\":0}],\"techStack\":[]}. confidence must be between 0 and 1. techStack must list the recommended technologies (languages, frameworks, databases, and key services) for building this project — never a cost or price. Base estimates only on the provided requirement summary and detected features.",
    [prompt_constants_js_1.PROMPT_TYPES.PROPOSAL]: "You are a proposal writer for {{organizationName}}. Draft a client-ready software proposal for \"{{consultationTitle}}\". Industry: {{industry}}. Project type: {{projectType}}. Timeline: {{timeline}}. Budget range: {{budgetRange}}. Respond with ONLY valid JSON (no markdown fences) using this exact shape: {\"title\":\"\",\"executiveSummary\":\"\",\"scopeOfWork\":[],\"deliverables\":[],\"timeline\":\"\",\"assumptions\":[],\"exclusions\":[],\"pricingNotes\":\"\",\"proposalMarkdown\":\"\"}. proposalMarkdown must never be empty: it is a complete, standalone client-facing markdown document (with headings) that restates the title, executive summary, scope of work, deliverables, timeline, assumptions, exclusions, and pricing notes in full prose. assumptions and exclusions must each contain at least one item; if none are notable, include a single explicit entry such as \"No additional assumptions beyond the requirement summary.\" or \"No exclusions beyond the defined scope of work.\". Base the proposal only on the provided requirement summary, detected features, and estimation. Do not invent unsupported scope.",
    [prompt_constants_js_1.PROMPT_TYPES.EMAIL]: "You are a professional communications assistant for {{organizationName}}. Draft a clear, concise email related to consultation \"{{consultationTitle}}\". Keep tone professional and actionable.",
    [prompt_constants_js_1.PROMPT_TYPES.MEETING_SUMMARY]: "You are a meeting summarizer for {{organizationName}}. Produce a structured summary for consultation \"{{consultationTitle}}\" with decisions, action items, and next steps.",
    [prompt_constants_js_1.PROMPT_TYPES.CLIENT_REQUIREMENT_DISCOVERY]: "You are a friendly software consultant conducting a brief pre-consultation discovery interview with a prospective client, before they meet a human consultant. The client wants to build: \"{{projectIdea}}\". They have chosen a {{consultationTime}}-minute consultation, so ask {{questionGuidance}} in total across the whole interview — enough to give the human consultant a useful head start, without overwhelming the client. Target platforms: {{platforms}}. You have already asked {{questionsAskedSoFar}} question(s) in this interview, out of a maximum of {{maxQuestions}}. This is a hard limit, not a suggestion: if {{questionsAskedSoFar}} is already at or above {{maxQuestions}}, you MUST set completed to true and question to null right now, even if you can think of another good question — never exceed the maximum. Otherwise, ask exactly ONE short, clear, plain-language question at a time — no markdown, no numbering, no preamble, no multiple questions in one turn. Build on the client's previous answers rather than repeating a topic already covered. If you already have a reasonably clear picture of what they want to build before reaching the maximum, stop early and mark the interview complete instead of asking filler questions just to reach the limit. Output ONLY a single syntactically valid JSON object and nothing else: no markdown fences, no comments, no text before or after it, and no extra or missing braces. Use exactly this shape: {\"question\":\"string or null\",\"completed\":true|false}. When completed is true, question must be null. When completed is false, question must be a non-empty question and completed must be false.",
};
const USER_PROMPT_TEMPLATES = {
    [prompt_constants_js_1.PROMPT_TYPES.CONSULTATION]: "{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_EXTRACTION]: "{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION]: "Detect software features from this requirement summary:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING]: "Match these detected features to the feature library templates:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY]: "Create a requirement summary from this consultation conversation:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.ESTIMATION]: "Generate a project effort estimation from this requirement summary and detected features:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.PROPOSAL]: "Generate a professional software proposal from this requirement summary, detected features, and estimation:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.EMAIL]: "Draft an email based on:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.MEETING_SUMMARY]: "Summarize the meeting notes:\n\n{{userMessage}}",
    [prompt_constants_js_1.PROMPT_TYPES.CLIENT_REQUIREMENT_DISCOVERY]: "{{userMessage}}",
};
class PromptBuilder {
    buildSystemPrompt(promptType, variables = {}) {
        return this.applyTemplate(SYSTEM_PROMPT_TEMPLATES[promptType], variables);
    }
    buildUserPrompt(promptType, variables = {}) {
        return this.applyTemplate(USER_PROMPT_TEMPLATES[promptType], variables);
    }
    injectOrganizationContext(organization, variables = {}) {
        if (!organization) {
            return { ...variables };
        }
        return {
            ...variables,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_ID]: organization.id,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME]: organization.name,
        };
    }
    injectConsultationContext(consultation, variables = {}) {
        if (!consultation) {
            return { ...variables };
        }
        return {
            ...variables,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.CONSULTATION_ID]: consultation.id,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE]: consultation.title,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.INDUSTRY]: consultation.industry ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE]: consultation.projectType ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE]: consultation.budgetRange ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.TIMELINE]: consultation.timeline ?? "unspecified",
        };
    }
    injectConversationHistory(history, maxHistory = prompt_constants_js_1.PROMPT_DEFAULTS.MAX_CONVERSATION_HISTORY) {
        if (!history || history.length === 0) {
            return [];
        }
        const trimmed = history.slice(-maxHistory);
        return trimmed.map((message) => ({
            role: message.role,
            content: message.content,
        }));
    }
    buildMessages(input) {
        const historyMessages = this.injectConversationHistory(input.conversationHistory, input.maxHistory ?? prompt_constants_js_1.PROMPT_DEFAULTS.MAX_CONVERSATION_HISTORY);
        const messages = [
            {
                role: ai_constants_js_1.AI_ROLES.SYSTEM,
                content: input.systemPrompt,
            },
            ...historyMessages,
            {
                role: ai_constants_js_1.AI_ROLES.USER,
                content: input.userPrompt,
            },
        ];
        return messages;
    }
    build(input) {
        let variables = this.injectOrganizationContext(input.organization, input.variables ?? {});
        variables = this.injectConsultationContext(input.consultation, variables);
        variables = {
            ...variables,
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.ORGANIZATION_NAME] ??
                "the organization",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.CONSULTATION_TITLE] ??
                "the consultation",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.INDUSTRY]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.INDUSTRY] ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.PROJECT_TYPE] ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.BUDGET_RANGE] ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.TIMELINE]: variables[prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.TIMELINE] ?? "unspecified",
            [prompt_constants_js_1.RESERVED_TEMPLATE_VARIABLES.USER_MESSAGE]: input.userMessage,
        };
        const systemPrompt = this.buildSystemPrompt(input.promptType, variables);
        const userPrompt = this.buildUserPrompt(input.promptType, variables);
        const messages = this.buildMessages({
            systemPrompt,
            userPrompt,
            conversationHistory: input.conversationHistory,
        });
        const request = {
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
    applyTemplate(template, variables) {
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
            const value = variables[key];
            if (value === null || value === undefined) {
                return "";
            }
            return String(value);
        });
    }
}
exports.PromptBuilder = PromptBuilder;
exports.promptBuilder = new PromptBuilder();
