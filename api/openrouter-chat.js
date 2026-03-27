export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const body = req.body ?? {};
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const payload = body.payload;

  if (!apiKey) {
    return res.status(400).json({ error: { message: '缺少 OpenRouter API Key。' } });
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: { message: '请求体缺少 payload。' } });
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://vercel.app',
        'X-Title': 'ozon-listing-upgrade',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(responseText || '{}');
  } catch (error) {
    console.error('[openrouter-chat] upstream request failed', error);
    return res.status(502).json({ error: { message: '代理请求 OpenRouter 失败，请稍后重试。' } });
  }
}
