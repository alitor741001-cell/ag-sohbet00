import { Check, Loader2, TriangleAlert, X } from 'lucide-react';

// iPhone Face ID halkası: kameranın çevresinde duran sabit çember.
// Çember dolmaz; tarama boyunca kırmızı, sarı, yeşil ve pembe renkler tek tek,
// sırayla yanar. Doğrulandığında yeşil, eşleşmediğinde kırmızı olur.
const TONE = {
  scanning: '#22c55e',
  verifying: '#22c55e',
  ok: '#22c55e',
  fail: '#ef4444',
};

export default function FaceRing({ phase = 'scanning', rejected = false, videoRef, cameraReady, cameraError, onStart }) {
  const tone = rejected ? TONE.fail : TONE[phase] || TONE.scanning;
  return (
    <div className="relative mx-auto mt-4 h-[228px] w-[228px]" onPointerDown={onStart}>
      {/* Dolmayan sabit halka: doğrulandığında yeşil, eşleşmediğinde kırmızı kalır. */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full border-[3px]"
        style={{ borderColor: tone, boxShadow: `0 0 8px ${tone}` }}
        aria-hidden="true"
      />
      {/* Tarama boyunca halka kırmızı, sarı, yeşil ve pembe renklerle sırayla yanar. */}
      {phase === 'scanning' && <span className="face-ring-colors pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />}
      <div className={`absolute inset-[11px] overflow-hidden rounded-full border border-white/10 bg-black ${phase === 'fail' ? 'face-ring-shake' : ''}`}>
        {/* Video kendi çemberine kırpılır: kapsayıcının yuvarlaklığı videoyu her tarayıcıda kesmiyor. */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
          style={{ clipPath: 'circle(50% at 50% 50%)', borderRadius: '9999px' }}
        />
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