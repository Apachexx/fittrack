"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.revokeToken = revokeToken;
exports.isTokenRevoked = isTokenRevoked;
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
function getRedis() {
    if (!process.env.REDIS_URL)
        return null;
    if (!redis) {
        redis = new ioredis_1.default(process.env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
        });
        redis.on('error', (err) => {
            console.warn('Redis bağlantı hatası (önbellek devre dışı):', err.message);
            redis = null;
        });
    }
    return redis;
}
async function cacheGet(key) {
    const client = getRedis();
    if (!client)
        return null;
    try {
        return await client.get(key);
    }
    catch {
        return null;
    }
}
async function cacheSet(key, value, ttlSeconds) {
    const client = getRedis();
    if (!client)
        return;
    try {
        await client.setex(key, ttlSeconds, value);
    }
    catch {
        // Redis yoksa sessizce geç
    }
}
async function cacheDel(key) {
    const client = getRedis();
    if (!client)
        return;
    try {
        await client.del(key);
    }
    catch {
        // sessizce geç
    }
}
async function revokeToken(jti, ttlSeconds) {
    const client = getRedis();
    if (!client)
        return;
    try {
        await client.setex(`revoked:${jti}`, ttlSeconds, '1');
    }
    catch {
        // sessizce geç
    }
}
async function isTokenRevoked(jti) {
    const client = getRedis();
    if (!client)
        return false;
    try {
        const val = await client.get(`revoked:${jti}`);
        return val === '1';
    }
    catch {
        return false;
    }
}
