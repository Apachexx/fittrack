"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../db/redis");
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Yetkilendirme başlığı eksik' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        // Token iptal kontrolü (async ama hata verirse devam et)
        if (payload.jti) {
            (0, redis_1.isTokenRevoked)(payload.jti).then((revoked) => {
                if (revoked) {
                    res.status(401).json({ error: 'Token iptal edilmiş' });
                    return;
                }
                req.user = { id: payload.sub, email: payload.email };
                next();
            }).catch(() => {
                req.user = { id: payload.sub, email: payload.email };
                next();
            });
        }
        else {
            req.user = { id: payload.sub, email: payload.email };
            next();
        }
    }
    catch {
        res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
}
