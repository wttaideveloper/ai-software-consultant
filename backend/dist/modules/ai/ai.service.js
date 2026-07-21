"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
class AIService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async generateResponse(request) {
        return this.provider.generateResponse(request);
    }
    getProviderName() {
        return this.provider.name;
    }
}
exports.AIService = AIService;
