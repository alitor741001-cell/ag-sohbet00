import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, ScanFace, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { enrollFace, verifyFace } from '@/lib/faceCheck';
import { requestTiltPermission, watchTilt } from '@/lib/faceTilt';
import FaceRing from '@/components/face/FaceRing';

// Üst üste başarısız denemede cihaz erişimi kapatılır.
const MAX_ATTEMPTS = 3;
// Halka kendiliğinden bu sürede dolar; telefon yukarı-aşağı çevrildikçe hızlanır.
const SCAN_MS = 3400;
const TILT_DEGREES = 150;
const RETRY_MS = 1400;
const DONE_MS = 750;
const TICK_MS = 80;

const COPY = {
  enroll: {
    title: 'Yüz kaydı oluştur',
    hint: 'Hesabınıza bir kez yüz kaydı alınır. Bu kayıt, farklı bir cihazdan girişte ve elmas/bakiye bölümünde doğrulama için kullanılır.',
  },
  device: {
    title: 'Yüz doğrulaması',
    hint: 'Hesabınıza bu cihazdan ilk kez giriş yapılıyor. Devam etmek için telefonu yukarı-aşağı çevirip yüzünüzü doğrulayın.',
  },
  balance: {
    title: 'Bakiye doğrulaması',
    hint: 'Elmas ve bakiye bölümü yüz doğrulamasıyla korunur. Doğrulama cihaz başına bir kez istenir.',
  },
};

const PHASE_TEXT = {
  scanning: 'Telefonu yukarı-aşağı çevirin — halka dolunca kendiliğinden onaylanır.',
  verifying: 'Yüzünüz karşılaştırılıyor...',
  ok: 'Doğrulandı',
  fail: 'Tekrar deneniyor...',
};

/**
 * Tam ekran yüz kilidi: kamera açıkken iPhone Face ID gibi bir halka dolar,
 * telefon yukarı-aşağı çevrildikçe hızlanır ve halka dolduğunda kendi kendine
 * doğrular. Eşleşmezse halka kırmızıya döner ve yeniden dener.
 */
export default function FaceLockOverlay({
  open = true,
  user,
  mode = 'verify',
  scope = 'device',
  canCancel = false,
  showLogout = true,
  onVerified,
  onCancel,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanStartRef = useRef(Date.now());
  const tiltBoostRef = useRef(0);
  const busyRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryRef = useRef(null);
  const doneRef = useRef(null);
  const askedRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [phase, setPhase] = useState('scanning');
  const [progress, setProgress] = useState(0);
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

  useEffect(() => () => {
    clearTimeout(retryRef.current);
    clearTimeout(doneRef.current);
  }, []);

  const blocked = scope === 'device' && attempts >= MAX_ATTEMPTS;

  const captureSelfie = useCallback(() => new Promise((resolve) => {
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
  }), []);

  // Eşleşmeyen denemeden sonra halka kırmızıda bekler, sonra yeniden taramaya döner.
  const scheduleRetry = useCallback((message) => {
    setPhase('fail');
    setError(message);
    if (scope === 'device' && attemptsRef.current >= MAX_ATTEMPTS) return;
    retryRef.current = setTimeout(() => {
      tiltBoostRef.current = 0;
      scanStartRef.current = Date.now();
      setProgress(0);
      setPhase('scanning');
    }, RETRY_MS);
  }, [scope]);

  const submit = useCallback(async () => {
    if (busyRef.current || blocked) return;
    busyRef.current = true;
    setPhase('verifying');
    setError('');
    try {
      const file = await captureSelfie();
      if (!file) {
        scheduleRetry('Kamera görüntüsü alınamadı.');
        return;
      }
      const result = mode === 'enroll'
        ? await enrollFace(user.id, file)
        : await verifyFace(user.id, file, scope);
      if (result?.ok || result?.reason === 'unavailable') {
        setProgress(1);
        setPhase('ok');
        doneRef.current = setTimeout(() => onVerified?.(), DONE_MS);
        return;
      }
      if (result?.reason === 'enroll_required') {
        scheduleRetry('Yüz kaydı bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      scheduleRetry(attemptsRef.current >= MAX_ATTEMPTS
        ? 'Yüz doğrulaması yapılamadı.'
        : 'Yüz eşleşmedi. Işığın yüzünüze geldiğinden emin olup telefonu tekrar çevirin.');
    } catch (e) {
      scheduleRetry(e?.response?.data?.error || e?.message || 'Doğrulama yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      busyRef.current = false;
    }
  }, [blocked, captureSelfie, mode, onVerified, scheduleRetry, scope, user?.id]);

  // Tarama halkası: kendi süresiyle dolar, çevirme hareketi hızlandırır.
  useEffect(() => {
    if (!open || blocked || !cameraReady || phase !== 'scanning') return undefined;
    const id = setInterval(() => {
      const value = Math.min(1, (Date.now() - scanStartRef.current) / SCAN_MS + tiltBoostRef.current);
      setProgress(value);
      if (value >= 1) submit();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [open, blocked, cameraReady, phase, submit]);

  // iOS'ta sensör izni yalnızca dokunuşla istenir; istemezse tarama yine ilerler.
  const beginTilt = useCallback(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    requestTiltPermission();
  }, []);

  useEffect(() => {
    if (!open || blocked || phase !== 'scanning') return undefined;
    return watchTilt((delta) => {
      tiltBoostRef.current = Math.min(0.85, tiltBoostRef.current + delta / TILT_DEGREES);
    });
  }, [open, blocked, phase]);

  if (!open) return null;

  const copy = blocked
    ? { title: 'Erişim kapatıldı', hint: 'Yüz doğrulaması yapılamadı. Bu hesaba bu cihazdan erişim kapatıldı.' }
    : mode === 'enroll' ? COPY.enroll : COPY[scope] || COPY.device;

  const logout = () => base44.auth.logout('/login');

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-[#08080c]/98 px-4 py-6 backdrop-blur" onPointerDown={beginTilt}>
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
          <>
            <FaceRing
              phase={blocked ? 'fail' : phase}
              progress={progress}
              videoRef={videoRef}
              cameraReady={cameraReady}
              cameraError={cameraError}
              onStart={beginTilt}
            />
            <p className="mt-3 text-[11px] font-semibold text-white/55">{PHASE_TEXT[phase]}</p>
          </>
        )}

        {error && <p className="mt-2 text-[11px] font-semibold text-premium-red">{error}</p>}

        <div className="mt-3 flex flex-col gap-2">
          {canCancel && !blocked && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-2xl border border-white/12 px-5 py-2.5 text-[12px] font-bold text-white/70"
            >
              Vazgeç
            </button>
          )}
          {(blocked || cameraError || (scope === 'device' && showLogout)) && (
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