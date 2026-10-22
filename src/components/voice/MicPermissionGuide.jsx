import { useEffect, useState } from 'react';
import { MicOff, Check } from 'lucide-react';

/** Platform algılama: iOS Safari ve Android Chrome için mikrofon ayar yönergeleri. */
function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  if (isIOS) return { os: 'ios', browser: isSafari ? 'safari' : 'other' };
  if (isAndroid) return { os: 'android', browser: isChrome ? 'chrome' : 'other' };
  return { os: 'desktop', browser: 'other' };
}

const PLATFORM_STEPS = {
  ios: [
    { title: 'Ayarlar', desc: 'Ana ekrandan Ayarlar uygulamasını aç.' },
    { title: 'Safari', desc: 'Ayarlar listesinde Safari bölümünü bul ve seç.' },
    { title: 'Mikrofon', desc: 'Safari ayarlarında Mikrofon satırına dokun.' },
    { title: 'İzin Ver', desc: 'Mikrofon iznini "İzin Ver" olarak değiştir.' },
    { title: 'Geri dön', desc: 'Uygulamaya geri dön, mikrofon otomatik açılacak.' },
  ],
  android: [
    { title: 'Adres çubuğu', desc: 'Tarayıcının üstündeki kilit (🔒) veya ⓘ simgesine dokun.' },
    { title: 'İzinler', desc: 'Açılan menüden İzinler bölümüne dokun.' },
    { title: 'Mikrofon', desc: 'Listeden Mikrofon iznini seç.' },
    { title: 'İzin ver', desc: '"Yalnızca siteyi kullanırken izin ver" seçeneğini işaretle.' },
    { title: 'Geri dön', desc: 'Uygulamaya geri dön, mikrofon otomatik açılacak.' },
  ],
  desktop: [
    { title: 'Adres çubuğu', desc: 'Tarayıcının sol üstündeki kilit (🔒) simgesine tıkla.' },
    { title: 'Mikrofon', desc: 'Site izinleri listesinden Mikrofon seçeneğini bul.' },
    { title: 'İzin ver', desc: 'Mikrofon iznini "İzin Ver" olarak değiştir.' },
    { title: 'Geri dön', desc: 'Sayfaya geri dön, mikrofon otomatik açılacak.' },
  ],
};

/**
 * Mikrofon izni reddedildiğinde kullanıcıyı platformuna göre cihaz ayarlarına
 * yönlendiren rehber diyalog. Kullanıcı ayarlardan izin verip geri döndüğünde
 * mikrofon otomatik olarak açılır ve bir daha izin istenmez.
 */
export default function MicPermissionGuide({ open, onClose, onRetry }) {
  const [platform] = useState(detectPlatform);
  const [retrying, setRetrying] = useState(false);

  // Kullanıcı ayarlardan dönüp uygulamaya geri geldiğinde izni yeniden kontrol et.
  useEffect(() => {
    if (!open) return undefined;
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // Sayfa tekrar görünür olduğunda getUserMedia çağırarak izin değişip değişmediğini kontrol et.
      // İzin verilmişse mikrofon otomatik açılır; verilmediyse diyalog açık kalır.
      if (onRetry) onRetry();
    };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
  }, [open, onRetry]);

  if (!open) return null;

  const steps = PLATFORM_STEPS[platform.os] || PLATFORM_STEPS.desktop;
  const osLabel = platform.os === 'ios' ? 'iOS' : platform.os === 'android' ? 'Android' : 'Bilgisayar';

  const handleRetry = async () => {
    setRetrying(true);
    try { await onRetry?.(); }
    finally { setRetrying(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#1a1a1a] p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)*0.5))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <MicOff className="h-6 w-6 text-red-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white">Mikrofon izni gerekli</h2>
            <p className="text-[12px] text-white/55">Konuşmak için mikrofon iznini açmalısın · {osLabel}</p>
          </div>
        </div>

        <div className="mb-4 space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white/90">{step.title}</p>
                <p className="text-[11px] leading-snug text-white/50">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/70 transition-transform active:scale-95"
          >
            Kapat
          </button>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {retrying ? 'Kontrol ediliyor…' : 'Tekrar dene'}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] leading-snug text-white/35">
          İzin verdikten sonra geri döndüğünde mikrofon otomatik açılır ve bir daha sorulmaz.
        </p>
      </div>
    </div>
  );
}