"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const db_1 = require("../db");
const redis_1 = require("../db/redis");
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function generateAccessToken(userId, email) {
    const jti = (0, uuid_1.v4)();
    const token = jsonwebtoken_1.default.sign({ sub: userId, email, jti }, process.env.JWT_ACCESS_SECRET, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: (process.env.ACCESS_TOKEN_TTL || '15m') });
    return { token, jti };
}
function generateRefreshToken() {
    return crypto_1.default.randomBytes(64).toString('hex');
}
async function register(name, email, password) {
    const existing = await (0, db_1.queryOne)('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await (0, db_1.queryOne)('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url, created_at', [name, email, passwordHash]);
    if (!user)
        throw new Error('Kullanıcı oluşturulamadı');
    const tokens = await createTokenPair(user.id, user.email);
    return { user: formatUser(user), tokens };
}
async function login(email, password) {
    const user = await (0, db_1.queryOne)('SELECT id, email, name, avatar_url, password_hash, created_at FROM users WHERE email = $1', [email]);
    if (!user)
        throw new Error('E-posta veya şifre hatalı');
    const passwordMatch = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!passwordMatch)
        throw new Error('E-posta veya şifre hatalı');
    const tokens = await createTokenPair(user.id, user.email);
    return { user: formatUser(user), tokens };
}
async function refresh(rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await (0, db_1.queryOne)('SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()', [tokenHash]);
    if (!stored)
        throw new Error('Geçersiz veya süresi dolmuş refresh token');
    // Token rotasyonu: eskiyi iptal et
    await (0, db_1.query)('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [stored.id]);
    const user = await (0, db_1.queryOne)('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1', [stored.user_id]);
    if (!user)
        throw new Error('Kullanıcı bulunamadı');
    const tokens = await createTokenPair(user.id, user.email);
    return { user: formatUser(user), tokens };
}
async function logout(userId, jti) {
    // Tüm refresh token'ları iptal et
    await (0, db_1.query)('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
    // Access token'ı Redis'te iptal et
    if (jti) {
        const decoded = jsonwebtoken_1.default.decode(jsonwebtoken_1.default.sign({}, 'x'));
        const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
        await (0, redis_1.revokeToken)(jti, Math.max(ttl, 0));
    }
}
async function createTokenPair(userId, email) {
    const { token: accessToken } = generateAccessToken(userId, email);
    const rawRefresh = generateRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await (0, db_1.query)('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, tokenHash, expiresAt.toISOString()]);
    return { accessToken, refreshToken: rawRefresh };
}
function formatUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
    };
}
