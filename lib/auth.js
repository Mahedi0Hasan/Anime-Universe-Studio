import { timingSafeEqual, createHash } from 'node:crypto';

const h = (s) => createHash('sha256').update(String(s)).digest();

// Returns true when the request carries the studio password. Otherwise answers and returns false.
export function auth(req, res) {
  const pass = process.env.STUDIO_PASSWORD;
  if (!pass) {
    res.status(503).json({ error: 'STUDIO_PASSWORD সেট করা নেই (Vercel → Settings → Environment Variables)।' });
    return false;
  }
  const got = req.headers['x-studio-key'] || '';
  if (!timingSafeEqual(h(got), h(pass))) {
    res.status(401).json({ error: 'পাসওয়ার্ড ভুল।' });
    return false;
  }
  return true;
}

export function need(res, name) {
  if (process.env[name]) return process.env[name];
  res.status(503).json({ error: `${name} সেট করা নেই (Vercel → Settings → Environment Variables)।` });
  return null;
}

export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
