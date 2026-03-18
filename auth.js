"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const KEY_LENGTH = 64;
function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
    const hash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedPassword) {
    const [salt, storedHash] = storedPassword.split(":");
    if (!salt || !storedHash) {
        return storedPassword === password;
    }
    const derivedHash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH);
    const storedHashBuffer = Buffer.from(storedHash, "hex");
    if (storedHashBuffer.length !== derivedHash.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(storedHashBuffer, derivedHash);
}
