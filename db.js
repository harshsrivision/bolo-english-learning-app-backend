"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.query = query;
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
exports.db = connectionString ? new pg_1.Pool({ connectionString }) : null;
async function query(text, params = []) {
    if (!exports.db) {
        throw new Error("DATABASE_URL is not configured.");
    }
    return exports.db.query(text, params);
}
