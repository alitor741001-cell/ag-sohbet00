import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, ScanFace, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { enrollFace, verifyFace } from '@/lib/faceCheck';
import FaceRing from '@/components/face/FaceRing';
import useLiveFaceSteps from '@/components/face/useLiveFaceSteps';

// Üst üste başarısız denemede cihaz erişimi kapatılır.
const MAX_ATTEMPTS = 3;
const RETRY_MS = 800;
const DONE_MS = 450;

// Her adım yalnızca kamera görüntüsünde istenen hareket doğrulanırsa ilerler.
const HEAD_STEPS = [
  { key: 'up', label: 'Yukarı', hint: 'Kafanızı yukarı çevirin', ms: 3400, at: 2500 },
  { key: 'down', label: 'Aşağı', hint: 'Kafanızı aşağı çevirin', ms: 3400, at: 2500 },
  { key: 'right', label: 'Sağa', hint: 'Kafanızı sağa çevirin', ms: 3400, at: 2500 },
  { key: 'left', label: 'Sola', hint: 'Kafanızı sola çevirin', ms: 3400, at: 2500 },
];
// Göz kırpma: gözler kapatılır, hemen ardından açılır; iki kare birlikte kırpmayı doğrular.
const BLINK_STEPS = [
  { key: 'eyes_closed', label: 'Kapat', hint: 'Gözlerinizi kapatın ve kısa süre kapalı tutun', ms: 3000, at: 2100 },
  { key: 'eyes_open', label: 'Aç', hint: 'Gözlerinizi açın', ms: 2200, at: 1000 },
];
// Kayıtta referans yüz için düz bakan fotoğraf alınır.
const FRONT_STEP = { key: 'front', label: 'Ön', hint: 'Kameraya düz bakın', ms: 3000, at: 1800 };
const VERIFY_STEPS = [...HEAD_STEPS, ...BLINK_STEPS];
const ENROLL_STEPS = [FRONT_STEP, ...VERIFY_STEPS];
const STEP_NAMES = {
  up: 'yukarı bakma',
  down: 'aşağı bakma',
  right: 'sağa bakma',
  left: 'sola bakma',
  eyes_closed: 'gözlerinizi kapatma',
  eyes_open: 'gözlerinizi açma',
};

const COPY = {
  enroll: {
    title: 'Yüz kaydı oluştur',
    hint: 'Hesabınıza bir kez yüz kaydı alınır. Ekrandaki yönergelerle kafanızı çevirin ve gözlerinizi kırpın.',
  },
  device: {
    title: 'Yüz doğrulaması',
    hint: 'Hesabınıza bu cihazdan ilk kez giriş yapılıyor. Ekrandaki yönergelerle kafanızı çevirin ve gözlerinizi kırpın.',
  },
  balance: {
    title: 'Bakiye doğrulaması',
    hint: 'Elmas ve bakiye bölümü yüz doğrulamasıyla korunur. Ekrandaki yönergelerle kafanızı çevirin ve gözlerinizi kırpın.',
  },
};

const PHASE_TEXT = {
  verifying: 'Hareketleriniz ve yüzünüz karşılaştırılıyor...',
  ok: 'Doğrulandı',
  fail: 'Tekrar deneniyor...',
};

/**
 * Tam ekran yüz kilidi: kamera açıkken iPhone Face ID gibi halka yavaş yavaş
 * dolar. Kullanıcı her adımda kafasını istenen yöne çevirir ve gözlerini kırpar;
 * her adımın sonunda fotoğraf alınır. Sunucu dört yönü ve göz kırpmayı referans
 * yüzle karşılaştırır. Hareket ya da kırpma algılanmazsa halka kırmızıya döner.
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
  const busyRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryRef = useRef(null);
  const doneRef = useRef(null);
  const steps = mode === 'enroll' ? ENROLL_STEPS : VERIFY_STEPS;
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
      if (result?.ok === true) {
        setProgress(1);
        setPhase('ok');
        doneRef.current = setTimeout(() => onVerified?.(), DONE_MS);
        return;
      }
      if (result?.reason === 'unavailable' || result?.reason === 'busy') {
        scheduleRetry(result?.error || 'Görüntü doğrulanamadı; onay verilmedi. Lütfen tekrar deneyin.');
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
      // Kafa hareketi ya da göz kırpma algılanmadı: hangi adımların eksik olduğu söylenir.
      if (result?.reason === 'no_pose') {
        const missing = (result.missing || []).map((key) => STEP_NAMES[key]).filter(Boolean);
        scheduleRetry(missing.length
          ? `Algılanmayan adımlar: ${missing.join(', ')}. Yönergeleri belirgin şekilde tekrar uygulayın.`
          : 'Hareketleriniz algılanmadı. Yönergeleri belirgin şekilde tekrar uygulayın.');
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

  const acceptStep = useCallback((file) => {
    const step = steps[stepIndex];
    shotsRef.current = { ...shotsRef.current, [step.key]: file };
    setShots(shotsRef.current);
    setProgress((stepIndex + 1) / steps.length);
    if (stepIndex + 1 === steps.length) submit();
    else setStepIndex(stepIndex + 1);
  }, [steps, stepIndex, submit]);

  const { checking, rejected } = useLiveFaceSteps({
    active: open && !blocked && cameraReady && phase === 'scanning',
    steps, index: stepIndex, capture: captureSelfie, accept: acceptStep, feedback: setError,
  });

  if (!open) return null;

  const copy = blocked
    ? { title: 'Erişim kapatıldı', hint: 'Yüz doğrulaması yapılamadı. Bu hesaba bu cihazdan erişim kapatıldı.' }
    : mode === 'enroll' ? COPY.enroll : COPY[scope] || COPY.device;

  const logout = () => base44.auth.logout('/login');
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const statusText = phase === 'scanning'
    ? `${currentStep.hint}${checking ? ' — görüntü kontrol ediliyor, hareketi koruyun...' : ''}`
    : PHASE_TEXT[phase];

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
              rejected={rejected && phase === 'scanning'}
              progress={progress}
              videoRef={videoRef}
              cameraReady={cameraReady}
              cameraError={cameraError}
            />
            <p className={`mt-3 text-[12px] font-black ${phase === 'scanning' ? 'text-premium-gold' : 'text-white/70'}`}>{statusText}</p>
            {phase !== 'ok' && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
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