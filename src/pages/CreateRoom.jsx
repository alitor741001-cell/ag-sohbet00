import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { readRoomPreset, saveRoomPreset } from '@/lib/roomPreset';
import { useToast } from '@/components/ui/use-toast';
import { Home, Mic, Settings } from 'lucide-react';
import SeatCountPicker from '@/components/voice/SeatCountPicker';

/**
 * Oda kur sayfası: tek bir ev düğmesi vardır. Oda adı ve sesli bölüm kayıtlıysa
 * basıldığı anda oda doğrudan açılır; ilk basışta bu iki bilgi sorulur ve kaydedilir.
 * Oda sesli sohbet odası olarak açılır; film odası kurulmaz.
 */
export default function CreateRoom() {
  const navigate = useNavigate();
  const { user, setUser } = useCurrentUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [seatCount, setSeatCount] = useState(8);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const prefilled = useRef(false);
  // Oda sesli sohbet odası olarak açıldığı için kayıtlı bilgiler sesli oda kaydından okunur.
  const preset = readRoomPreset(user, 'voice');

  // Kayıtlı bilgiler forma hazır gelir: düzenlerken tekrar yazmak gerekmez.
  useEffect(() => {
    if (prefilled.current || !preset) return;
    prefilled.current = true;
    setName(preset.name || '');
    setSeatCount(Number(preset.seat_count) || 8);
  }, [preset]);

  const settingsOf = (values) => ({
    name: String(values.name || '').trim(),
    seat_count: Number(values.seat_count) || 8,
  });

  // Bilgiler kayıtlıysa hiçbir şey sorulmadan oda açılır.
  const openMyRoom = async (values) => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await base44.functions.invoke('personal-room', { settings: { ...settingsOf(values), voice: true } });
      navigate(`/sesli-oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  // İlk basışta oda adı ve sesli bölüm sorulur; sonraki basışlarda oda doğrudan açılır.
  const handleMyRoom = () => {
    if (opening) return;
    if (preset?.name && !formOpen) { openMyRoom({ name: preset.name, seat_count: preset.seat_count }); return; }
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { toast({ title: 'Oda adı gerekli', variant: 'destructive' }); return; }
    setSaving(true);
    const values = settingsOf({ name, seat_count: seatCount });
    try {
      const res = await base44.functions.invoke('personal-room', { settings: { ...values, voice: true } });
      // Girilen bilgiler otomatik kaydedilir: sonraki açılışta hiçbir şey sorulmaz.
      await saveRoomPreset('voice', values, setUser);
      toast({ title: 'Sesli oda açıldı' });
      navigate(`/sesli-oda/${res.data.id}`);
    } catch (err) {
      toast({ title: 'Hata', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-[hsl(var(--secondary))] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#f2ce6b]/40 border border-[#f2ce6b]/20 placeholder:text-gray-500";

  return (
    <div className="dark relative min-h-screen overflow-x-clip bg-anthracite text-white">
      {/* Zemin ana sayfayla aynı: antrasit üstünde hafif altın/kırmızı ışıklar. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-premium-red/10 blur-3xl" />
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-premium-gold/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-64 w-64 rounded-full bg-premium-gold-deep/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-3 py-6 text-white sm:px-5">
      {/* Tek düğme: ev işareti. Bilgiler kayıtlıysa basıldığı anda oda açılır. */}
      <div className="relative overflow-hidden rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.16), rgba(242,206,107,0.08))', border: '1px solid rgba(242,206,107,0.28)' }}>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl opacity-30" style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />
        <div className="relative flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.35), rgba(242,206,107,0.25))' }}>
            <Home className="w-6 h-6 text-[#f2ce6b]" />
          </span>
          <h1 className="text-xl font-extrabold">Oda Kur</h1>
          <p className="text-xs text-gray-400">Oda adı ve sesli bölüm bir kez girilir; sonraki açılışlarda tekrar sorulmaz.</p>
        </div>

        <div className="relative mt-5 flex flex-col items-stretch gap-2">
          <button onClick={handleMyRoom} disabled={opening} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Home className="w-5 h-5" /> {opening ? 'Açılıyor...' : 'Odamı Aç'}
          </button>
          {preset?.name && !formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className="text-xs font-semibold text-[#f2ce6b]/75 underline">
              Oda adını ve sesli bölümü değiştir
            </button>
          )}
        </div>
      </div>

      {/* Form: yalnızca ilk kurulumda ya da bilgileri değiştirirken görünür */}
      {formOpen && (
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5 text-gray-300">Oda Adı</label>
            <div className="relative">
              <input className={inputCls + ' pr-10'} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Cuma Gecesi Sineması" maxLength={60} required />
              <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <Mic className="w-4 h-4 text-[#f2ce6b]" /> Sesli Bölüm
            </label>
            <SeatCountPicker value={seatCount} onChange={setSeatCount} />
            <p className="mt-2 text-xs text-gray-500">Seçtiğin sayı kadar mikrofon koltuğu açılır; odan sesli sohbet odası olarak açılır.</p>
          </div>

          <button type="submit" disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Home className="w-5 h-5" /> {saving ? 'Oda açılıyor...' : 'Odayı Aç'}
          </button>
        </form>
      )}
      </div>
    </div>
  );
}