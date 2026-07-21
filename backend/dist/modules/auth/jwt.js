"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../../config/env.js");
const auth_constants_js_1 = require("./auth.constants.js");
function isJwtPayload(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return (typeof candidate.sub === "string" &&
        typeof candidate.organizationId === "string" &&
        typeof candidate.email === "string" &&
        (candidate.type === auth_constants_js_1.TOKEN_KINDS.ACCESS ||
            candidate.type === auth_constants_js_1.TOKEN_KINDS.REFRESH));
}
function signToken(payload, secret, expiresIn) {
    const options = {
        expiresIn: expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function generateAccessToken(input) {
    const payload = {
        ...input,
        type: auth_constants_js_1.TOKEN_KINDS.ACCESS,
    };
    return signToken(payload, env_js_1.config.JWT_SECRET, env_js_1.config.ACCESS_TOKEN_EXPIRES);
}
function generateRefreshToken(input) {
    const payload = {
        ...input,
        type: auth_constants_js_1.TOKEN_KINDS.REFRESH,
    };
    return signToken(payload, env_js_1.config.JWT_REFRESH_SECRET, env_js_1.config.REFRESH_TOKEN_EXPIRES);
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.JWT_SECRET);
    if (!isJwtPayload(decoded) || decoded.type !== auth_constants_js_1.TOKEN_KINDS.ACCESS) {
        throw new Error("Invalid access token");
    }
    return {
        sub: decoded.sub,
        organizationId: decoded.organizationId,
        email: decoded.email,
        type: auth_constants_js_1.TOKEN_KINDS.ACCESS,
    };
}
function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.JWT_REFRESH_SECRET);
    if (!isJwtPayload(decoded) || decoded.type !== auth_constants_js_1.TOKEN_KINDS.REFRESH) {
        throw new Error("Invalid refresh token");
    }
    return {
        sub: decoded.sub,
        organizationId: decoded.organizationId,
        email: decoded.email,
        type: auth_constants_js_1.TOKEN_KINDS.REFRESH,
    };
}
