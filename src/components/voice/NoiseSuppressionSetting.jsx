import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { getMicNoiseSuppression, setMicNoiseSuppression, supportsMicNoiseSuppression } from '@/lib/micSource';

export default function NoiseSuppressionSetting() {
  const [enabled, setEnabled] = useState(getMicNoiseSuppression);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const supported = supportsMicNoiseSuppression();
  const toggle = async () => {
    setPending(true);
    setError('');
    try {
      await setMicNoiseSuppression(!enabled);
      setEnabled(!enabled);
    } catch {
      setError('Ses ayarı uygulanamadı. Lütfen tekrar deneyin.');
    } finally { setPending(false); }
  };
  return (
    <div className="rounded-2xl border border-border bg-background/30 p-3 text-foreground">
      <button type="button" role="switch" aria-checked={enabled && supported} aria-label="Mikrofon gürültü engelleyici" disabled={!supported || pending} onClick={toggle} className="flex w-full items-center gap-3 text-left disabled:opacity-50">
        {pending ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" /> : <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />}
        <span className="flex-1 text-sm font-bold">Gürültü engelleyici</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled && supported ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{pending ? 'Uygulanıyor' : enabled && supported ? 'Açık' : 'Kapalı'}</span>
      </button>
      <p className="mt-2 text-[11px] text-foreground/70">{supported ? 'Kendi mikrofonunuzdaki ortam gürültüsünü ve yankıyı azaltır; otomatik ses yükseltmeyi kapatır. Tercihiniz bu cihazda saklanır.' : 'Bu tarayıcı gürültü engellemeyi desteklemiyor.'}</p>
      <p className="mt-1 text-[11px] text-foreground/70">Müzik, inşaat ve yakındaki konuşmaların tamamen silinmesi garanti değildir; sonuç cihaza bağlıdır. En iyi sonuç için kulaklık kullanın.</p>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}