import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { revokeToken } from '../db/redis';

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  password_hash: string;
  created_at: string;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(userId: string, email: string): { token: string; jti: string } {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: userId, email, jti },
    process.env.JWT_ACCESS_SECRET!,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: (process.env.ACCESS_TOKEN_TTL || '15m') as any }
  );
  return { token, jti };
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function register(name: string, email: string, password: string) {
  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    throw new Error('Bu e-posta adresi zaten kullanılıyor');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await queryOne<UserRow>(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url, created_at',
    [name, email, passwordHash]
  );

  if (!user) throw new Error('Kullanıcı oluşturulamadı');

  const tokens = await createTokenPair(user.id, user.email);
  return { user: formatUser(user), tokens };
}

export async function login(email: string, password: string) {
  const user = await queryOne<UserRow>(
    'SELECT id, email, name, avatar_url, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  if (!user) throw new Error('E-posta veya şifre hatalı');

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw new Error('E-posta veya şifre hatalı');

  const tokens = await createTokenPair(user.id, user.email);
  return { user: formatUser(user), tokens };
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await queryOne<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()',
    [tokenHash]
  );

  if (!stored) throw new Error('Geçersiz veya süresi dolmuş refresh token');

  // Token rotasyonu: eskiyi iptal et
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [stored.id]);

  const user = await queryOne<UserRow>(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
    [stored.user_id]
  );
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const tokens = await createTokenPair(user.id, user.email);
  return { user: formatUser(user), tokens };
}

export async function logout(userId: string, jti?: string) {
  // Tüm refresh token'ları iptal et
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);

  // Access token'ı Redis'te iptal et
  if (jti) {
    const decoded = jwt.decode(jwt.sign({}, 'x')) as { exp?: number };
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
    await revokeToken(jti, Math.max(ttl, 0));
  }
}

async function createTokenPair(userId: string, email: string) {
  const { token: accessToken } = generateAccessToken(userId, email);
  const rawRefresh = generateRefreshToken();
  const tokenHash = hashToken(rawRefresh);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt.toISOString()]
  );

  return { accessToken, refreshToken: rawRefresh };
}

function formatUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };
}
