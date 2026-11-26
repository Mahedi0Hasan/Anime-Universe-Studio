import { auth, need, body } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;
  const key = need(res, 'ANTHROPIC_API_KEY');
  if (!key) return;
  const { input } = body(req);
  if (!input || typeof input !== 'string') return res.status(400).json({ error: 'input লাগবে।' });
  const messages = [{ role: 'user', content: input.slice(0, 400_000) }];
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 16000, stream: true, messages }),
  });
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).error?.message || msg; } catch {}
    return res.status(r.status === 429 ? 429 : 502).json({ error: 'Claude API: ' + msg });
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  const dec = new TextDecoder();
  let buf = '', stop = '';
  for await (const chunk of r.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') res.write(ev.delta.text);
        if (ev.type === 'message_delta' && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
        if (ev.type === 'error') res.write('\n\n[Claude error: ' + (ev.error?.message || '') + ']');
      } catch {}
    }
  }
  res.end('\u0000' + JSON.stringify({ stop }));
}
