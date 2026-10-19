import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const attempts = new Map();
const WINDOW_SECONDS = 900;
const LUA = `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`;

export async function contactRateLimited(req) {
  // Vercel sets x-vercel-forwarded-for at its edge. Ignore client-supplied forwarding headers locally.
  const ip = process.env.VERCEL === '1'
    ? String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim()
    : req.socket?.remoteAddress;
  if (!ip || (process.env.VERCEL === '1' && !isIP(ip))) throw new Error('Missing trusted client IP');
  const secret = process.env.CONTACT_RATE_LIMIT_SECRET || process.env.RESEND_API_KEY || 'local-development';
  const key = 'contact:rate:' + createHmac('sha256', secret).update(ip).digest('hex');
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url || token) {
    if (!url || !token || new URL(url).protocol !== 'https:') throw new Error('Invalid rate limit configuration');
    const response = await fetch(url, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', LUA, '1', key, String(WINDOW_SECONDS)]),
      signal: AbortSignal.timeout(4000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Rate limit service unavailable');
    const data = await response.json();
    if (data.error || !Number.isSafeInteger(data.result) || data.result < 1) throw new Error('Invalid rate limit response');
    return data.result > 5;
  }
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.until <= now) attempts.delete(id);
  const entry = attempts.get(key) || { count: 0, until: now + WINDOW_SECONDS * 1000 };
  if (!attempts.has(key) && attempts.size >= 5000) return true;
  entry.count++;
  attempts.set(key, entry);
  return entry.count > 5;
}
