"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function formatLog(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}
exports.logger = {
    info(message) {
        console.log(formatLog("INFO", message));
    },
    warn(message) {
        console.warn(formatLog("WARN", message));
    },
    error(message) {
        console.error(formatLog("ERROR", message));
    },
    debug(message) {
        console.debug(formatLog("DEBUG", message));
    },
};
