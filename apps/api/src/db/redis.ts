import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
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

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, value);
  } catch {
    // Redis yoksa sessizce geç
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // sessizce geç
  }
}

export async function revokeToken(jti: string, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(`revoked:${jti}`, ttlSeconds, '1');
  } catch {
    // sessizce geç
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const val = await client.get(`revoked:${jti}`);
    return val === '1';
  } catch {
    return false;
  }
}
