// Cihaz / IP tespiti için ortak yardımcılar — register-session tarafından kullanılır.

export function getClientIp(req) {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') || h.get('cf-connecting-ip') || h.get('true-client-ip') || h.get('x-client-ip') || '';
}

export function parseUserAgent(ua) {
  ua = ua || '';
  let os = 'Bilinmiyor';
  let browser = 'Bilinmiyor';
  let deviceType = 'Bilgisayar';
  let model = '';

  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/iPhone|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  if (/iPad/i.test(ua)) deviceType = 'Tablet';
  else if (/Mobile|Android|iPhone|iPod/i.test(ua)) deviceType = 'Telefon';
  else deviceType = 'Bilgisayar';

  if (/iPhone/i.test(ua)) model = 'iPhone';
  else if (/iPad/i.test(ua)) model = 'iPad';
  else if (/Macintosh/i.test(ua)) model = 'Mac';
  else {
    const m = ua.match(/Android[^;]*;\s*([^;)]+?)\s*(?:Build|\))/i);
    if (m) model = m[1].trim();
  }

  return { os, browser, deviceType, model };
}