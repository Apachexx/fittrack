import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenRevoked } from '../db/redis';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Yetkilendirme başlığı eksik' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      email: string;
      jti?: string;
    };

    // Token iptal kontrolü (async ama hata verirse devam et)
    if (payload.jti) {
      isTokenRevoked(payload.jti).then((revoked) => {
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
    } else {
      req.user = { id: payload.sub, email: payload.email };
      next();
    }
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}
