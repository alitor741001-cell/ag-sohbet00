import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GamePoolStats from './GamePoolStats';
import { GAME_NAMES, POOL_FIELDS } from './poolFields';

const pickValues = (pool) => Object.fromEntries(POOL_FIELDS.map((field) => [field.key, String(pool[field.key] ?? '')]));

/** Tek oyunun havuz ayarları ve özeti. */
export default function GamePoolCard({ pool, onSaved, onRefresh }) {
  const [values, setValues] = useState(() => pickValues(pool));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { setValues(pickValues(pool)); }, [pool]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('game-pool-admin', { action: 'update', game: pool.game, values });
      onSaved(response.data.pool);
      setMessage('Kaydedildi.');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const reserve = 100 - (Number(values.cut_pct) || 0) - (Number(values.rtp_pct) || 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-white">{GAME_NAMES[pool.game] || pool.game}</h2>
        <button type="button" onClick={onRefresh} aria-label="Yenile" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <GamePoolStats pool={pool} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {POOL_FIELDS.map((field) => (
          <label key={field.key} className="grid gap-1 text-xs text-white/70">
            <span>{field.label} <span className="text-white/40">({field.unit})</span></span>
            <Input
              type="number"
              inputMode="decimal"
              value={values[field.key]}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              className="bg-black/30 text-white"
            />
          </label>
        ))}
      </div>
      <p className={`mt-3 text-xs ${reserve < 0 ? 'text-red-400' : 'text-white/60'}`}>
        Rezerv (otomatik): %{reserve} — kesinti + RTP + rezerv her zaman %100 eder.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save} disabled={saving || reserve < 0} className="bg-red-600 hover:bg-red-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet
        </Button>
        {message && <span className="text-xs text-white/70">{message}</span>}
      </div>
    </section>
  );
}