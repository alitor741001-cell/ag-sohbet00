import { useEffect, useState } from 'react';
import { ScanFace } from 'lucide-react';
import { faceStatus, setFaceEnabled } from '@/lib/faceCheck';
import { useToast } from '@/components/ui/use-toast';
import FaceLockOverlay from '@/components/face/FaceLockOverlay';

/** Eklentiler bölümündeki anahtar: yüz doğrulaması istemlerini açar/kapatır. */
export default function FaceVerifyToggle({ user }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(null);
  const [saving, setSaving] = useState(false);
  // Açma işleminden sonra cihaz güveni sıfırlanır: doğrulama hemen yeniden istenir.
  const [verify, setVerify] = useState(null);

  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    faceStatus(user.id)
      .then((status) => { if (alive) setEnabled(status.enabled !== false); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const change = async () => {
    if (saving || enabled === null) return;
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    try {
      const result = await setFaceEnabled(next);
      if (result?.check) setVerify({ mode: result?.enrolled === false ? 'enroll' : 'verify' });
      toast({
        title: next ? 'Yüz doğrulaması açıldı' : 'Yüz doğrulaması kapatıldı',
        description: next
          ? 'Farklı cihazdan girişte ve elmas/bakiye bölümünde yüz doğrulaması istenir.'
          : 'Yüz doğrulaması istemleri kapatıldı; yeni cihazlar sorulmadan giriş yapar.',
      });
    } catch (e) {
      setEnabled(!next);
      toast({ title: 'Ayar kaydedilemedi', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const on = enabled === true;
  return (
    <>
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10">
        <ScanFace className="h-5 w-5 text-premium-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">Yüz Doğrulaması</p>
        <p className="text-xs text-muted-foreground">
          {enabled === null
            ? 'Durum yükleniyor...'
            : on
              ? 'Açık — farklı cihazdan girişte ve bakiyede yüzünüz sorulur.'
              : 'Kapalı — yüz doğrulaması istenmez.'}
        </p>
      </div>
      <button
        type="button"
        onClick={change}
        disabled={saving || enabled === null}
        aria-pressed={on}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:opacity-50 ${on ? 'border-premium-gold bg-premium-red/70' : 'border-border bg-secondary'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-0.5'}`}
        />
      </button>
    </section>
    <FaceLockOverlay
      open={!!verify}
      user={user}
      mode={verify?.mode || 'verify'}
      scope="device"
      canCancel
      showLogout={false}
      blockOnFail={false}
      onCancel={() => setVerify(null)}
      onVerified={() => setVerify(null)}
    />
    </>
  );
}