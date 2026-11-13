/**
 * VPS API katmanı.
 *
 * Base44 backend'inden tamamen bağımsız çalışır: mevcut özellikler kendi
 * fonksiyonlarını kullanmaya devam eder, buradaki çağrılar yalnızca VPS'e gider.
 * Adres tek yerden yönetilir; gizli anahtar, token veya parola bu dosyada
 * tutulmaz ve tarayıcıya gönderilmez.
 */

export const VPS_API_ORIGIN = 'https://api.agsesli.com';
export const VPS_API_BASE = `${VPS_API_ORIGIN}/api`;

// VPS yanıt vermezse istek sonsuza kadar beklemez.
const DEFAULT_TIMEOUT_MS = 10000;

/** VPS çağrılarındaki her hata bu tiple döner: durum kodu, kod ve açıklama. */
export class VpsApiError extends Error {
  constructor(message, { status = 0, code = 'vps_error', data = null } = {}) {
    super(message);
    this.name = 'VpsApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path || '').replace(/^\/+/, '');
  return clean ? `${VPS_API_BASE}/${clean}` : VPS_API_BASE;
};

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const errorMessage = (status) => {
  if (status === 401 || status === 403) return 'VPS bu istek için yetki vermedi.';
  if (status === 404) return 'VPS üzerinde bu adres bulunamadı.';
  if (status === 429) return 'VPS çok fazla istek aldı, biraz sonra tekrar deneyin.';
  if (status >= 500) return `VPS sunucu hatası verdi (${status}).`;
  return `VPS isteği başarısız oldu (${status}).`;
};

/**
 * Tek bir VPS isteği yürütür ve JSON yanıtını döndürür.
 * Zaman aşımı, ağ hatası ve HTTP hataları VpsApiError olarak yükseltilir.
 */
export async function vpsRequest(method, path, { body, timeout = DEFAULT_TIMEOUT_MS, headers = {}, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeout));
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(buildUrl(path), {
      method: String(method || 'GET').toUpperCase(),
      headers: body === undefined
        ? { Accept: 'application/json', ...headers }
        : { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    throw new VpsApiError(
      aborted
        ? 'VPS sunucusu zamanında yanıt vermedi.'
        : 'VPS sunucusuna ulaşılamadı. Bağlantı veya alan adı erişimi (CORS) engelliyor olabilir.',
      { code: aborted ? 'timeout' : 'network' },
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await parseBody(response);

  if (!response.ok) {
    throw new VpsApiError(data?.message || data?.error || errorMessage(response.status), {
      status: response.status,
      code: 'http',
      data,
    });
  }

  return { status: response.status, data };
}

/** GET isteği: JSON yanıtını doğrudan döndürür. */
export async function vpsGet(path, options) {
  const { data } = await vpsRequest('GET', path, options);
  return data;
}

/** POST isteği: gövde JSON olarak gönderilir, JSON yanıtı döner. */
export async function vpsPost(path, body = {}, options) {
  const { data } = await vpsRequest('POST', path, { ...options, body });
  return data;
}

/**
 * Sağlık kontrolü. Yalnızca şu üç şart birlikte sağlanırsa başarılı sayılır:
 * HTTP 200, gövdede success === true ve status === "online".
 * Hata durumunda fırlatmaz; sonucu açıklamasıyla birlikte döndürür.
 */
export async function checkVpsHealth({ timeout = 8000 } = {}) {
  try {
    const { status, data } = await vpsRequest('GET', '/health', { timeout });
    if (status !== 200) {
      return { ok: false, status, online: false, reason: `Beklenen HTTP 200, gelen ${status}.`, data };
    }
    if (data?.success !== true) {
      return { ok: false, status, online: false, reason: 'Yanıtta success değeri true değil.', data };
    }
    if (data?.status !== 'online') {
      return { ok: false, status, online: false, reason: `Yanıtta status "${data?.status ?? ''}" geldi, "online" bekleniyor.`, data };
    }
    return { ok: true, status, online: true, reason: '', data };
  } catch (error) {
    return {
      ok: false,
      status: error?.status || 0,
      online: false,
      reason: error?.message || 'Sağlık kontrolü yapılamadı.',
      code: error?.code || 'vps_error',
      data: error?.data ?? null,
    };
  }
}