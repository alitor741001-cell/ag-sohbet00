const publishedOrigin = 'https://flimkeyfii.base44.app';
const mainBundle = 'index-DkbqjjHJ.js';

export default async function(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const requested = url.searchParams.get('asset') || mainBundle;
    if (!/^[A-Za-z0-9._-]+\.(js|css)$/.test(requested)) {
      return new Response('Geçersiz paket', { status: 400 });
    }

    const upstream = await fetch(`${publishedOrigin}/assets/${requested}`);
    if (!upstream.ok) return new Response('Paket bulunamadı', { status: 404 });

    let body = await upstream.text();
    if (requested.endsWith('.js')) {
      body = body
        .replace(/(["'])\.\/([^"']+\.(?:js|css))\1/g, (_match, quote, asset) => `${quote}/functions/recoveryBundle?asset=${asset}${quote}`)
        .replace(/(["'])assets\/([^"']+\.(?:js|css))\1/g, (_match, quote, asset) => `${quote}/functions/recoveryBundle?asset=${asset}${quote}`);
    } else {
      body = body.replace(/url\((['"]?)\.\/([^)'"\s]+)\1\)/g, `url(${publishedOrigin}/assets/$2)`);
    }

    return new Response(body, {
      headers: {
        'Content-Type': requested.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch {
    return new Response('Kurtarma paketi yüklenemedi', { status: 500 });
  }
}