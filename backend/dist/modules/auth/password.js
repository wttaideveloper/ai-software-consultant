"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_constants_js_1 = require("./auth.constants.js");
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, auth_constants_js_1.BCRYPT_SALT_ROUNDS);
}
async function comparePassword(password, passwordHash) {
    return bcrypt_1.default.compare(password, passwordHash);
}
