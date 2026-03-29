"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.queryOne = queryOne;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
pool.on('error', (err) => {
    console.error('PostgreSQL bağlantı hatası:', err);
});
exports.default = pool;
async function query(text, params) {
    const result = await pool.query(text, params);
    return result.rows;
}
async function queryOne(text, params) {
    const result = await pool.query(text, params);
    return result.rows[0] ?? null;
}
