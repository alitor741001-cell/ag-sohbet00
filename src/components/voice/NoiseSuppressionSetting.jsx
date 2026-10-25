import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { getMicNoiseSuppression, setMicNoiseSuppression, supportsMicNoiseSuppression } from '@/lib/micSource';

export default function NoiseSuppressionSetting({ Row }) {
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
    <div>
      <Row
        icon={pending ? Loader2 : ShieldCheck}
        title="Gürültü engelleyici"
        enabled={enabled && supported}
        disabled={!supported || pending}
        busy={pending}
        onToggle={toggle}
      />
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}