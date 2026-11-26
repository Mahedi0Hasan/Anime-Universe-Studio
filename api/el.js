import { auth, need, body } from '../lib/auth.js';

const EL = 'https://api.elevenlabs.io';

export default async function handler(req, res) {
  if (!auth(req, res)) return;
  const key = need(res, 'ELEVENLABS_API_KEY');
  if (!key) return;
  const H = { 'xi-api-key': key };
  const action = req.query.action;
  try {
    if (action === 'voices') {
      const lang = String(req.query.lang || ''), q = String(req.query.q || '');
      const own = await fetch(`${EL}/v2/voices?page_size=30${q ? '&search=' + encodeURIComponent(q) : ''}`, { headers: H }).then(r => r.ok ? r.json() : { voices: [] });
      const lib = await fetch(`${EL}/v1/shared-voices?page_size=20${lang ? '&language=' + encodeURIComponent(lang) : ''}${q ? '&search=' + encodeURIComponent(q) : ''}`, { headers: H }).then(r => r.ok ? r.json() : { voices: [] });
      const map = (v) => ({ voice_id: v.voice_id, name: v.name, description: v.description || Object.values(v.labels || {}).join(', '), preview_url: v.preview_url || '', public_owner_id: v.public_owner_id || '' });
      const ownList = (own.voices || []).filter(v => !lang || !v.labels?.language || v.labels.language === lang || (v.verified_languages || []).some(l => l.language === lang));
      return res.status(200).json({ voices: [...ownList.map(map), ...(lib.voices || []).map(map)].slice(0, 40) });
    }
    if (action === 'tts') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { text, voice_id, model_id, owner } = body(req);
      if (!text || !voice_id) return res.status(400).json({ error: 'text আর voice_id লাগবে।' });
      const call = () => fetch(`${EL}/v1/text-to-speech/${encodeURIComponent(voice_id)}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { ...H, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text: String(text).slice(0, 40000), model_id: model_id || 'eleven_multilingual_v2' }),
      });
      let r = await call();
      if (!r.ok && owner && (r.status === 404 || r.status === 400)) {
        // Library voice: add it to the account once, then retry.
        await fetch(`${EL}/v1/voices/add/${encodeURIComponent(owner)}/${encodeURIComponent(voice_id)}`, {
          method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ new_name: 'Studio ' + voice_id.slice(0, 6) }),
        });
        r = await call();
      }
      if (!r.ok) {
        let m = r.statusText;
        try { const j = await r.json(); m = j.detail?.message || j.detail || m; } catch {}
        return res.status(502).json({ error: 'ElevenLabs: ' + (typeof m === 'string' ? m : JSON.stringify(m)) });
      }
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.status(200).send(Buffer.from(await r.arrayBuffer()));
    }
    res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    res.status(500).json({ error: 'ElevenLabs সমস্যা: ' + (e.message || e) });
  }
}
