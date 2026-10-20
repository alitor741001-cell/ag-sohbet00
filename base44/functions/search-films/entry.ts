import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_RESULTS = 10;
// YouTube'un arama uç noktası: HTML kazımak yerine yapısal yanıt verir, engellenmez.
const SEARCH_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const CLIENT_VERSION = '2.20240101.00.00';

// Tür adı yazan kişi de film görsün: "dram" → "dram filmi Türkçe dublaj tek parça full izle".
const GENRES = [
  'dram', 'aksiyon', 'komedi', 'korku', 'gerilim', 'bilim kurgu', 'animasyon', 'romantik',
  'belgesel', 'savaş', 'macera', 'suç', 'fantastik', 'aile', 'dizi', 'yerli',
];

function normalizeQuery(raw) {
  const text = String(raw || '').trim();
  const lower = text.toLocaleLowerCase('tr');
  const genre = GENRES.some((name) => (
    lower === name || lower === `${name} film` || lower === `${name} filmi` || lower === `${name} filmleri`
  ));
  return genre ? `${text} filmi Türkçe dublaj tek parça full izle` : text;
}

/** Arama yanıtındaki video kayıtlarını toplar. */
function collect(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => collect(item, out));
    return;
  }
  const renderer = node.videoRenderer || node.videoWithContextRenderer;
  if (renderer && /^[A-Za-z0-9_-]{11}$/.test(renderer.videoId || '')) {
    out.push({
      video_id: renderer.videoId,
      title: renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || renderer.headline?.runs?.[0]?.text || '',
      channel: renderer.ownerText?.runs?.[0]?.text || renderer.longBylineText?.runs?.[0]?.text || '',
      length: renderer.lengthText?.simpleText || '',
    });
  }
  Object.values(node).forEach((item) => collect(item, out));
}

/** Tekrarları atar, başlıksız kayıtları eler ve sonucu sınırlar. */
function toResults(found) {
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

/** YouTube arama uç noktası (yapısal JSON yanıtı). */
async function searchApi(query) {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${SEARCH_KEY}&prettyPrint=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
      'Accept-Language': 'tr-TR,tr;q=0.9',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': CLIENT_VERSION,
    },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: CLIENT_VERSION, hl: 'tr', gl: 'TR' } },
      query,
    }),
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  const found = [];
  collect(data, found);
  return toResults(found);
}

/** Yedek yol: arama sayfasının içindeki veriden toplama. */
async function searchHtml(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=tr&gl=TR`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return [];
  const html = await res.text();
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
  return toResults(found);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').trim().slice(0, 120);
    if (query.length < 2) return Response.json({ results: [] });

    // Tür adı yazıldıysa film aramasına çevrilir; sonuç yoksa sayfa yöntemi denenir.
    const normalized = normalizeQuery(query);
    let results = await searchApi(normalized).catch(() => []);
    if (!results.length) results = await searchHtml(normalized).catch(() => []);
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}