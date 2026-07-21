"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptService = exports.PromptService = void 0;
const prompt_builder_js_1 = require("./prompt.builder.js");
class PromptService {
    builder;
    constructor(builder = prompt_builder_js_1.promptBuilder) {
        this.builder = builder;
    }
    buildPrompt(input) {
        this.assertPromptType(input.promptType);
        return this.builder.build(input);
    }
    buildAIRequest(input) {
        return this.buildPrompt(input).request;
    }
    assertPromptType(promptType) {
        if (!promptType) {
            throw new Error("Prompt type is required");
        }
    }
}
exports.PromptService = PromptService;
exports.promptService = new PromptService();
