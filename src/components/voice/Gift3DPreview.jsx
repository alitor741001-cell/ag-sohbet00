import { Coins, RotateCw, ZoomIn, X } from 'lucide-react';
import Gift3DViewer from '@/components/voice/three/Gift3DViewer';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import { MODEL_KIND_LABEL, giftModelKind, hasRealModel } from '@/lib/gift3d';

/** Hediye 3D önizlemesi: modeli döndür, yakınlaştır, animasyonu izle. */
export default function Gift3DPreview({ gift, onClose }) {
  if (!gift) return null;
  const real = hasRealModel(gift);
  const kind = giftModelKind(gift);

  return (
    <div className="fixed inset-0 z-[320] flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-white">{gift.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-white/55">
            <span>{gift.category || 'Hediye'}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-[#fbc02d]">
              <Coins className="h-3 w-3" /> {formatCoins((Number(gift.k_value) || 0) * K_UNIT)}
            </span>
            <span>·</span>
            <span>{MODEL_KIND_LABEL[kind] || 'Hediye'} 3D</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Gift3DViewer gift={gift} className="min-h-0 flex-1" />

      <div className="space-y-2 border-t border-white/10 px-4 pb-[max(env(safe-area-inset-bottom),0.9rem)] pt-3">
        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-white/60">
          <span className="flex items-center gap-1"><RotateCw className="h-3.5 w-3.5" /> Sürükle: döndür</span>
          <span className="flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" /> Tekerlek / iki parmak: yakınlaştır</span>
        </div>
        <p className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${real ? 'bg-emerald-500/10 text-emerald-200/90' : 'bg-amber-500/10 text-amber-200/90'}`}>
          {real
            ? 'GLB/GLTF modeli gerçek zamanlı yüklendi ve içindeki animasyon oynatılıyor.'
            : 'Bu hediye için GLB/GLTF dosyası yüklenmedi. Görünen şekil tarayıcıda gerçek zamanlı üretilen temsili 3D geometridir — gerçek model dosyası değil, ürün görseli de değil. Gerçek model eklemek için admin panelinde hediye kaydının “model dosyası (GLB/GLTF)” alanı doldurulur.'}
        </p>
      </div>
    </div>
  );
}