import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, ScanFace, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { enrollFace, verifyFace } from '@/lib/faceCheck';
import FaceRing from '@/components/face/FaceRing';

// Üst üste başarısız denemede cihaz erişimi kapatılır.
const MAX_ATTEMPTS = 3;
// Her kafa hareketi adımının süresi ve fotoğrafın alındığı an: kullanıcı kafasını
// çevirmeye zaman bulur, halka adımlar boyunca yavaş yavaş dolar.
const STEP_MS = 3600;
const CAPTURE_AT = 2700;
const TICK_MS = 90;
const RETRY_MS = 1600;
const DONE_MS = 750;

// Kafa hareketi adımları: kafanın çevrileceği yönler, sırayla.
const HEAD_STEPS = [
  { key: 'up', label: 'Yukarı', hint: 'Kafanızı yukarı çevirin' },
  { key: 'down', label: 'Aşağı', hint: 'Kafanızı aşağı çevirin' },
  { key: 'right', label: 'Sağa', hint: 'Kafanızı sağa çevirin' },
  { key: 'left', label: 'Sola', hint: 'Kafanızı sola çevirin' },
];
// Kayıtta referans yüz için düz bakan fotoğraf alınır.
const FRONT_STEP = { key: 'front', label: 'Ön', hint: 'Kameraya düz bakın' };
const ENROLL_STEPS = [FRONT_STEP, ...HEAD_STEPS];
const POSE_NAMES = { up: 'yukarı', down: 'aşağı', right: 'sağa', left: 'sola' };

const COPY = {
  enroll: {
    title: 'Yüz kaydı oluştur',
    hint: 'Hesabınıza bir kez yüz kaydı alınır. Ekrandaki yönergelerle kafanızı çevirin; bu kayıt sonraki doğrulamalarda kullanılır.',
  },
  device: {
    title: 'Yüz doğrulaması',
    hint: 'Hesabınıza bu cihazdan ilk kez giriş yapılıyor. Ekrandaki yönergelerle kafanızı yukarı, aşağı, sağa ve sola çevirin.',
  },
  balance: {
    title: 'Bakiye doğrulaması',
    hint: 'Elmas ve bakiye bölümü yüz doğrulamasıyla korunur. Ekrandaki yönergelerle kafanızı yukarı, aşağı, sağa ve sola çevirin.',
  },
};

const PHASE_TEXT = {
  verifying: 'Kafa hareketiniz ve yüzünüz karşılaştırılıyor...',
  ok: 'Doğrulandı',
  fail: 'Tekrar deneniyor...',
};

/**
 * Tam ekran yüz kilidi: kamera açıkken iPhone Face ID gibi halka yavaş yavaş
 * dolar. Kullanıcı her adımda kafasını istenen yöne (yukarı, aşağı, sağa, sola)
 * çevirir ve o anda fotoğraf alınır; sunucu dört fotoğrafı referans yüzle
 * karşılaştırır. Kafa çevrilmezse ya da yüz eşleşmezse halka kırmızıya döner.
 */
export default function FaceLockOverlay({
  open = true,
  user,
  mode = 'verify',
  scope = 'device',
  canCancel = false,
  showLogout = true,
  blockOnFail = true,
  onVerified,
  onCancel,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const shotsRef = useRef({});
  const shootingRef = useRef(false);
  const busyRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryRef = useRef(null);
  const doneRef = useRef(null);
  const steps = mode === 'enroll' ? ENROLL_STEPS : HEAD_STEPS;
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [phase, setPhase] = useState('scanning');
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [shots, setShots] = useState({});
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

  const blocked = blockOnFail && scope === 'device' && attempts >= MAX_ATTEMPTS;

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

  // Başarısız denemeden sonra halka kırmızıda bekler, sonra tüm adımlar baştan başlar.
  const scheduleRetry = useCallback((message) => {
    setPhase('fail');
    setError(message);
    shotsRef.current = {};
    setShots({});
    setProgress(0);
    setStepIndex(0);
    if (blockOnFail && scope === 'device' && attemptsRef.current >= MAX_ATTEMPTS) return;
    retryRef.current = setTimeout(() => {
      setProgress(0);
      setStepIndex(0);
      setPhase('scanning');
    }, RETRY_MS);
  }, [scope, blockOnFail]);

  const submit = useCallback(async () => {
    if (busyRef.current || blocked) return;
    busyRef.current = true;
    setPhase('verifying');
    setError('');
    try {
      const photos = shotsRef.current;
      const result = mode === 'enroll'
        ? await enrollFace(user.id, photos)
        : await verifyFace(user.id, photos, scope);
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
      // Yarım yüz ya da yüz yerine başka bir nesne: halka kırmızıya döner, deneme sayılmaz.
      if (result?.reason === 'no_face') {
        scheduleRetry('Yüzünüz tam görünmüyor. Yüzünüzün tamamı çemberin içinde olacak şekilde tekrar deneyin.');
        return;
      }
      // Kafa istenen yöne çevrilmemiş: deneme sayılmaz, hangi yön olduğu söylenir.
      if (result?.reason === 'no_pose') {
        const missing = (result.missing || []).map((key) => POSE_NAMES[key]).filter(Boolean);
        scheduleRetry(missing.length
          ? `Kafa hareketiniz algılanmadı: ${missing.join(', ')}. Kafanızı belirgin şekilde çevirip tekrar deneyin.`
          : 'Kafa hareketiniz algılanmadı. Kafanızı belirgin şekilde çevirip tekrar deneyin.');
        return;
      }
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      scheduleRetry(attemptsRef.current >= MAX_ATTEMPTS
        ? 'Yüz doğrulaması yapılamadı.'
        : 'Yüz eşleşmedi. Işığın yüzünüze geldiğinden emin olup tekrar deneyin.');
    } catch (e) {
      scheduleRetry(e?.response?.data?.error || e?.message || 'Doğrulama yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      busyRef.current = false;
    }
  }, [blocked, mode, onVerified, scheduleRetry, scope, user?.id]);

  // Tarama adımları: her adımda ekranda yönerge görünür, adımın sonunda fotoğraf
  // alınır ve halka adımlar boyunca yavaş yavaş dolar.
  useEffect(() => {
    if (!open || blocked || !cameraReady || phase !== 'scanning') return undefined;
    const total = steps.length * STEP_MS;
    const started = Date.now();
    let index = -1;
    const id = setInterval(async () => {
      if (shootingRef.current) return;
      const elapsed = Date.now() - started;
      const current = Math.min(steps.length - 1, Math.floor(elapsed / STEP_MS));
      if (current !== index) {
        index = current;
        setStepIndex(current);
      }
      setProgress(Math.min(1, elapsed / total));
      const step = steps[current];
      if (elapsed - current * STEP_MS >= CAPTURE_AT && !shotsRef.current[step.key]) {
        shootingRef.current = true;
        const file = await captureSelfie().catch(() => null);
        shootingRef.current = false;
        if (file) {
          shotsRef.current = { ...shotsRef.current, [step.key]: file };
          setShots(shotsRef.current);
        }
      }
      if (elapsed < total) return;
      if (steps.some((item) => !shotsRef.current[item.key])) {
        scheduleRetry('Kamera görüntüsü alınamadı.');
        return;
      }
      submit();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [open, blocked, cameraReady, phase, steps, captureSelfie, scheduleRetry, submit]);

  if (!open) return null;

  const copy = blocked
    ? { title: 'Erişim kapatıldı', hint: 'Yüz doğrulaması yapılamadı. Bu hesaba bu cihazdan erişim kapatıldı.' }
    : mode === 'enroll' ? COPY.enroll : COPY[scope] || COPY.device;

  const logout = () => base44.auth.logout('/login');
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const statusText = phase === 'scanning' ? currentStep.hint : PHASE_TEXT[phase];

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
          <>
            <FaceRing
              phase={phase}
              progress={progress}
              videoRef={videoRef}
              cameraReady={cameraReady}
              cameraError={cameraError}
            />
            <p className={`mt-3 text-[12px] font-black ${phase === 'scanning' ? 'text-premium-gold' : 'text-white/70'}`}>{statusText}</p>
            {phase !== 'ok' && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {steps.map(({ key, label }, index) => (
                  <span
                    key={key}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                      shots[key]
                        ? 'border-green-500/60 bg-green-500/15 text-green-300'
                        : phase === 'scanning' && index === stepIndex
                          ? 'border-premium-gold/60 bg-premium-gold/15 text-premium-gold'
                          : 'border-white/12 text-white/45'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
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