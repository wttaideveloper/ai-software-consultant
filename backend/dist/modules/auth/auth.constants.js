"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_KINDS = exports.BCRYPT_SALT_ROUNDS = exports.COOKIE_NAMES = exports.AUTH_HEADER = exports.TOKEN_TYPE = void 0;
exports.TOKEN_TYPE = "Bearer";
exports.AUTH_HEADER = "Authorization";
exports.COOKIE_NAMES = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
};
exports.BCRYPT_SALT_ROUNDS = 12;
exports.TOKEN_KINDS = {
    ACCESS: "access",
    REFRESH: "refresh",
};
