import { Check, Loader2, TriangleAlert, X } from 'lucide-react';

// iPhone Face ID halkası: kameranın çevresinde dolan çember.
// Tarama altın, doğrulandı yeşil, eşleşmedi kırmızı.
// Halka tarama boyunca yeşil dolar; yüz tam görünmezse ya da eşleşmezse kırmızıya döner.
const TONE = {
  scanning: '#22c55e',
  verifying: '#22c55e',
  ok: '#22c55e',
  fail: '#ef4444',
};

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FaceRing({ phase = 'scanning', progress = 0, videoRef, cameraReady, cameraError, onStart }) {
  const tone = TONE[phase] || TONE.scanning;
  const shown = phase === 'scanning' ? progress : 1;
  return (
    <div className="relative mx-auto mt-4 h-[228px] w-[228px]" onPointerDown={onStart}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3.5" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 120ms linear, stroke 220ms ease-out', filter: `drop-shadow(0 0 6px ${tone})` }}
        />
      </svg>
      <div className={`absolute inset-[11px] overflow-hidden rounded-full border border-white/10 bg-black ${phase === 'fail' ? 'face-ring-shake' : ''}`}>
        {/* Video kendi çemberine kırpılır: kapsayıcının yuvarlaklığı videoyu her tarayıcıda kesmiyor. */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
          style={{ clipPath: 'circle(50% at 50% 50%)', borderRadius: '9999px' }}
        />
        {phase === 'scanning' && cameraReady && (
          <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-black text-white">
            {Math.round(progress * 100)}%
          </span>
        )}
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-4 text-center">
            {cameraError ? (
              <>
                <TriangleAlert className="h-7 w-7 text-premium-red" />
                <p className="text-[11px] font-semibold text-white/70">{cameraError}</p>
              </>
            ) : (
              <Loader2 className="h-7 w-7 animate-spin text-premium-gold" />
            )}
          </div>
        )}
      </div>
      {phase === 'ok' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500">
            <Check className="h-10 w-10 text-green-400" />
          </span>
        </div>
      )}
      {phase === 'fail' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-500">
            <X className="h-10 w-10 text-red-400" />
          </span>
        </div>
      )}
    </div>
  );
}