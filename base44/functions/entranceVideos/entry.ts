import { createClientFromRequest } from 'npm:@base44/sdk@0.8.56';
import OpenAI from 'npm:openai@6.45.0';
import { rateLimit } from '../../shared/security.ts';
import { giftLock } from '../../shared/supabaseMirror.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Yalnızca yönetici video üretebilir.' }, { status: 403 });
    const body = await req.json();
    if (!['estimate','create','retrieve'].includes(body.action) || typeof body.product_id !== 'string') return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
    const product = await base44.asServiceRole.entities.CosmeticProduct.get(body.product_id).catch(() => null);
    if (!product || product.category !== 'entrance') return Response.json({ error: 'Giriş efekti bulunamadı.' }, { status: 404 });
    const connection = base44.asServiceRole.aiGateway.connection();
    const videos = new OpenAI({ baseURL: connection.baseURL, apiKey: connection.token, defaultHeaders: connection.headers, timeout: 30000, maxRetries: 0 }).videos;
    const request = { model: 'seedance_2_fast', seconds: 6, resolution: '720p', aspect_ratio: '9:16', generate_audio: false,
      prompt: `Create a premium six-second room-entrance animation from the provided artwork, titled ${product.name.slice(0,80)}. Preserve the exact original character or vehicle, silhouette, materials, colors and any existing emblem. Animate only that existing subject with believable movement, light trails, energy waves and restrained particles appropriate to it. Cinematic dark background, centered composition, smooth arrival and departure, mobile-friendly. Do not add unrelated objects or characters. No shopping cards, price labels, buttons, new lettering or names. The user's portrait and VIP badge are overlaid separately by the application.` };
    if (body.action === 'estimate') {
      const rl = await rateLimit(base44, 'entrance-estimate:' + user.id, user.id, 12, 60000);
      if (!rl.allowed) return Response.json({ error: 'Biraz sonra tekrar dene.' }, { status: 429 });
      const estimate = await videos.create({ ...request, dry_run: true }, { maxRetries: 0 });
      return Response.json({ estimated_credits: estimate.usage?.base44_credits, seconds: 6, model: request.model });
    }
    if (body.action === 'retrieve') {
      if (!product.video_job_id) return Response.json({ error: 'Devam eden üretim yok.' }, { status: 400 });
      const video = await videos.retrieve(product.video_job_id);
      const patch = { video_status: video.status };
      if (video.status === 'completed' && typeof video.url === 'string' && video.url.startsWith('https://')) patch.video_url = video.url;
      if (patch.video_url || patch.video_status !== product.video_status) await base44.asServiceRole.entities.CosmeticProduct.update(product.id, patch);
      return Response.json({ id: video.id, status: video.status, url: video.url || '', error: video.error?.message || '' });
    }
    const rl = await rateLimit(base44, 'entrance-generate:' + user.id, user.id, 3, 60000);
    if (!rl.allowed) return Response.json({ error: 'Dakikada en fazla üç video üretimi başlatılabilir.' }, { status: 429 });
    if (!/^mp\/private\/[a-zA-Z0-9_./-]{1,1500}$/.test(body.reference_uri || '')) return Response.json({ error: 'Önce kırpılmış referans görselini yükle.' }, { status: 400 });
    const token = crypto.randomUUID();
    if (!await giftLock(base44, [`video:${product.id}`], token)) return Response.json({ error: 'Bu efekt için üretim zaten başlatılıyor.' }, { status: 409 });
    try {
      const fresh = await base44.asServiceRole.entities.CosmeticProduct.get(product.id);
      if (fresh.video_job_id && ['queued','in_progress','completed'].includes(fresh.video_status)) return Response.json({ id: fresh.video_job_id, status: fresh.video_status, url: fresh.video_url || '' });
      const video = await videos.create({ ...request, frame_images: [{ type: 'image_url', image_url: { url: body.reference_uri }, frame_type: 'first_frame' }] }, { maxRetries: 0 });
      await base44.asServiceRole.entities.CosmeticProduct.update(product.id, { video_job_id: video.id, video_status: video.status, ...(video.status==='completed' && video.url ? { video_url: video.url } : {}) });
      return Response.json({ id: video.id, status: video.status, url: video.url || '' }, { status: 202 });
    } finally { await giftLock(base44, [], token, true); }
  } catch (error) { return Response.json({ error: error.message || 'Video işlemi tamamlanamadı.' }, { status: 500 }); }
}