import { useEffect, useRef, useState } from 'react';
import { Loader2, LogOut, ScanFace, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { enrollFace, verifyFace } from '@/lib/faceCheck';

// Üst üste başarısız denemede cihaz erişimi kapatılır.
const MAX_ATTEMPTS = 3;

const COPY = {
  enroll: {
    title: 'Yüz kaydı oluştur',
    hint: 'Hesabınıza bir kez yüz kaydı alınır. Bu kayıt, farklı bir cihazdan girişte ve elmas/bakiye bölümünde doğrulama için kullanılır.',
  },
  device: {
    title: 'Yüz doğrulaması',
    hint: 'Hesabınıza bu cihazdan ilk kez giriş yapılıyor. Devam etmek için yüzünüzü doğrulayın.',
  },
  balance: {
    title: 'Bakiye doğrulaması',
    hint: 'Elmas ve bakiye bölümü yüz doğrulamasıyla korunur. Doğrulama cihaz başına bir kez istenir.',
  },
};

/**
 * Tam ekran yüz kilidi: kameradan canlı fotoğraf çeker, sunucuda referans yüzle
 * karşılaştırır. Giriş kapısı (yeni cihaz) ve bakiye kilidi aynı ekranı kullanır.
 */
export default function FaceLockOverlay({
  open = true,
  user,
  mode = 'verify',
  scope = 'device',
  canCancel = false,
  onVerified,
  onCancel,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setCameraReady(false);
    setCameraError('');
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch {
        if (!cancelled) setCameraError('Kameraya erişilemedi. Kamera iznini verip tekrar deneyin.');
      }
    };
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const blocked = scope === 'device' && attempts >= MAX_ATTEMPTS;
  const copy = blocked
    ? { title: 'Erişim kapatıldı', hint: 'Yüz doğrulaması yapılamadı. Bu hesaba bu cihazdan erişim kapatıldı.' }
    : mode === 'enroll' ? COPY.enroll : COPY[scope] || COPY.device;

  const captureSelfie = () => new Promise((resolve) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return resolve(null);
    // Kare ortadan kırpılır: yüz, doğrulamada merkezde kalsın.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext('2d').drawImage(
      video,
      (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side,
      0, 0, 512, 512
    );
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], 'yuz.jpg', { type: 'image/jpeg' }) : null),
      'image/jpeg', 0.86
    );
  });

  const submit = async () => {
    if (busy || blocked) return;
    setBusy(true);
    setError('');
    try {
      const file = await captureSelfie();
      if (!file) {
        setError('Kamera görüntüsü alınamadı. Tekrar deneyin.');
        return;
      }
      const result = mode === 'enroll'
        ? await enrollFace(user.id, file)
        : await verifyFace(user.id, file, scope);
      if (result?.ok) {
        onVerified?.();
        return;
      }
      // Karşılaştırma servisi yanıt vermezse kullanıcı içeri alınır, kilitlenmez.
      if (result?.reason === 'unavailable') {
        onVerified?.();
        return;
      }
      if (result?.reason === 'enroll_required') {
        setError('Yüz kaydı bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      setError(next >= MAX_ATTEMPTS
        ? 'Yüz doğrulaması yapılamadı.'
        : 'Yüz eşleşmedi. Işığın yüzünüze geldiğinden emin olup tekrar deneyin.');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Doğrulama yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => base44.auth.logout('/login');

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-[#08080c]/98 px-4 py-6 backdrop-blur">
      <div
        className="w-full max-w-sm rounded-3xl border border-premium-gold/40 p-5 text-center"
        style={{
          background: 'linear-gradient(150deg, rgba(38,16,16,0.96), rgba(12,8,8,0.98))',
          boxShadow: '0 0 42px -18px rgba(198,40,40,0.95)',
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-premium-gold/45 bg-black/40">
          {blocked ? <TriangleAlert className="h-6 w-6 text-premium-red" /> : <ScanFace className="h-6 w-6 text-premium-gold" />}
        </div>
        <h2 className="mt-3 text-lg font-black text-white">{copy.title}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-white/60">{copy.hint}</p>

        {!blocked && (
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center">
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
            <div className="pointer-events-none absolute inset-6 rounded-full border border-premium-gold/35" />
          </div>
        )}

        {error && <p className="mt-3 text-[11px] font-semibold text-premium-red">{error}</p>}

        {!blocked && (
          <button
            type="button"
            onClick={submit}
            disabled={busy || !cameraReady}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #c62828, #7f1d1d 55%, #d4af37)',
              border: '1px solid rgba(242,206,107,0.55)',
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
            {busy ? 'Doğrulanıyor...' : mode === 'enroll' ? 'Yüz kaydını oluştur' : 'Fotoğraf çek ve doğrula'}
          </button>
        )}

        <div className="mt-2 flex flex-col gap-2">
          {canCancel && !blocked && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-2xl border border-white/12 px-5 py-2.5 text-[12px] font-bold text-white/70"
            >
              Vazgeç
            </button>
          )}
          {(blocked || cameraError || scope === 'device') && (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-premium-red/40 px-5 py-2.5 text-[12px] font-bold text-white/70"
            >
              <LogOut className="h-3.5 w-3.5" /> Çıkış yap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}