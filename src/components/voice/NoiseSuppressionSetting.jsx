import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { getMicNoiseSuppression, setMicNoiseSuppression } from '@/lib/micSource';

export default function NoiseSuppressionSetting({ Row }) {
  const [enabled, setEnabled] = useState(getMicNoiseSuppression);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const toggle = async (next) => {
    const value = typeof next === 'boolean' ? next : !enabled;
    setPending(true);
    setError('');
    try {
      await setMicNoiseSuppression(value);
      setEnabled(value);
    } catch {
      setError('Ses ayarı uygulanamadı. Lütfen tekrar deneyin.');
    } finally { setPending(false); }
  };
  return (
    <div>
      <Row
        icon={pending ? Loader2 : ShieldCheck}
        title="Gürültü engelleyici"
        enabled={enabled}
        disabled={pending}
        busy={pending}
        onToggle={toggle}
      />
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}