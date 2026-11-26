import { put, get } from '@vercel/blob';
import { auth } from '../lib/auth.js';

const PATH = 'studio/state.json';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const r = await get(PATH, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return res.status(200).json({ state: null });
      const text = await new Response(r.stream).text();
      return res.status(200).json({ state: JSON.parse(text) });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      JSON.parse(data); // validate
      if (data.length > 4_000_000) return res.status(413).json({ error: 'ডেটা অনেক বড়।' });
      await put(PATH, data, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: 'স্টোরেজ সমস্যা: ' + (e.message || e) });
  }
}
