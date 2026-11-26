import { auth, need, body } from '../lib/auth.js';

const CX = 'https://api.cartesia.ai';
const VERSION = '2026-08-14';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  const key = need(res, 'CARTESIA_API_KEY');
  if (!key) return;
  const H = { Authorization: 'Bearer ' + key, 'Cartesia-Version': VERSION };
  const action = req.query.action;
  try {
    if (action === 'voices') {
      const p = new URLSearchParams({ limit: '30' });
      if (req.query.lang) p.set('language', String(req.query.lang));
      if (req.query.q) p.set('q', String(req.query.q));
      p.append('expand[]', 'preview_file_url');
      const r = await fetch(`${CX}/voices?${p}`, { headers: H });
      if (!r.ok) return res.status(502).json({ error: 'Cartesia: ' + r.status + ' ' + (await r.text()).slice(0, 200) });
      const d = await r.json();
      return res.status(200).json({ voices: (d.data || []).map(v => ({ id: v.id, name: v.name, gender: v.gender, description: v.description || v.tagline || '', preview_file_url: v.preview_file_url || null })) });
    }
    if (action === 'tts') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { text, voice_id, lang, emotion, speed } = body(req);
      if (!text || !voice_id) return res.status(400).json({ error: 'text আর voice_id লাগবে।' });
      const gc = {};
      if (emotion && emotion !== 'neutral') gc.emotion = emotion;
      const sp = Number(speed);
      if (sp && sp !== 1) gc.speed = Math.min(1.5, Math.max(0.6, sp));
      const payload = {
        model_id: 'sonic-3.6', transcript: String(text).slice(0, 40000), voice: { id: voice_id },
        output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
        ...(lang ? { language: lang } : {}), ...(Object.keys(gc).length ? { generation_config: gc } : {}),
      };
      const r = await fetch(`${CX}/tts/bytes`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) return res.status(502).json({ error: 'Cartesia: ' + r.status + ' ' + (await r.text()).slice(0, 300) });
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.status(200).send(Buffer.from(await r.arrayBuffer()));
    }
    res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    res.status(500).json({ error: 'Cartesia সমস্যা: ' + (e.message || e) });
  }
}
