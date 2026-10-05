import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_RESULTS = 10;

/** YouTube arama yanıtındaki video kayıtlarını toplar. */
function collect(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => collect(item, out));
    return;
  }
  const renderer = node.videoRenderer;
  if (renderer && /^[A-Za-z0-9_-]{11}$/.test(renderer.videoId || '')) {
    out.push({
      video_id: renderer.videoId,
      title: renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '',
      channel: renderer.ownerText?.runs?.[0]?.text || renderer.longBylineText?.runs?.[0]?.text || '',
      length: renderer.lengthText?.simpleText || '',
    });
  }
  Object.values(node).forEach((item) => collect(item, out));
}

/** Film adına göre YouTube aramasını yapar; başlık ve süre bilgisiyle gerçek videoları döner. */
async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=tr&gl=TR`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let html = '';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9' }, signal: controller.signal });
    if (res.ok) html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const match = html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return [];

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const found = [];
  collect(data, found);

  const seen = new Set();
  const results = [];
  for (const item of found) {
    if (!item.title || seen.has(item.video_id)) continue;
    seen.add(item.video_id);
    results.push(item);
    if (results.length >= MAX_RESULTS) break;
  }
  return results;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').trim().slice(0, 80);
    if (query.length < 2) return Response.json({ results: [] });

    const results = await searchYouTube(query);
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}