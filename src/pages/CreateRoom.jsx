import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { readRoomPreset, saveRoomPreset } from '@/lib/roomPreset';
import { useToast } from '@/components/ui/use-toast';
import { Users, Home, Settings, Mic, Video } from 'lucide-react';

/**
 * Oda kur sayfası: iki kısayol düğmesi ortada durur. "Kendi Odamı Aç" ilk basışta oda adını
 * sorar; ad kaydedilir, sonraki açılışlarda hiçbir şey sorulmadan oda doğrudan açılır.
 * Şifre, gizleme, sohbet ve kapasite oda içindeki ayarlardan yönetilir.
 */
export default function CreateRoom() {
  const navigate = useNavigate();
  const { user, setUser } = useCurrentUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const prefilled = useRef(false);
  const filmPreset = readRoomPreset(user, 'film');
  const voicePreset = readRoomPreset(user, 'voice');

  // Kayıtlı oda adı forma hazır gelir: düzenlerken tekrar yazmak gerekmez.
  useEffect(() => {
    if (prefilled.current || !filmPreset) return;
    prefilled.current = true;
    setName(filmPreset.name || '');
  }, [filmPreset]);

  // Kişisel oda kayıtlı adıyla açılır; diğer ayarlar oda içinden yapılır.
  const openMyRoom = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await base44.functions.invoke('personal-room', { settings: { name: filmPreset?.name || '' } });
      navigate(`/oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  // Kayıtlı ad varsa hiçbir şey sorulmadan oda açılır; yoksa ad formu gösterilir.
  const handleMyRoom = () => {
    if (opening) return;
    if (filmPreset?.name && !formOpen) { openMyRoom(); return; }
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { toast({ title: 'Oda adı gerekli', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const settings = { name: name.trim() };
      const res = await base44.functions.invoke('personal-room', { settings });
      // Girilen ad otomatik kaydedilir: sonraki açılışta hiçbir şey sorulmaz.
      await saveRoomPreset('film', settings, setUser);
      toast({ title: 'Oda açıldı' });
      navigate(`/oda/${res.data.id}`);
    } catch (err) {
      toast({ title: 'Hata', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Kayıtlı bilgilerle sesli oda: forma girmeden anında açılır.
  const openVoiceRoom = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await base44.functions.invoke('create-room', {
        name: voicePreset.name, room_type: 'voice', seat_count: Number(voicePreset.seat_count) || 8,
      });
      navigate(`/sesli-oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  const inputCls = "w-full bg-[hsl(var(--secondary))] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#f2ce6b]/40 border border-[#f2ce6b]/20 placeholder:text-gray-500";

  return (
    <div className="dark mx-auto w-full max-w-md px-3 py-6 text-white sm:px-5">
      {/* Kısayollar: ortada, alt alta */}
      <div className="relative overflow-hidden rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.16), rgba(242,206,107,0.08))', border: '1px solid rgba(242,206,107,0.28)' }}>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl opacity-30" style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />
        <div className="relative flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.35), rgba(242,206,107,0.25))' }}>
            <Users className="w-6 h-6 text-[#f2ce6b]" />
          </span>
          <h1 className="text-xl font-extrabold">Oda Kur</h1>
          <p className="text-xs text-gray-400">Oda adı bir kez girilir; sonraki açılışlarda tekrar sorulmaz.</p>
        </div>

        <div className="relative mt-5 flex flex-col items-stretch gap-2">
          <button onClick={handleMyRoom} disabled={opening} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Home className="w-5 h-5" /> {opening ? 'Açılıyor...' : 'Kendi Odamı Aç'}
          </button>
          {filmPreset?.name && !formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className="text-xs font-semibold text-[#f2ce6b]/75 underline">
              Oda adını değiştir
            </button>
          )}

          {voicePreset ? (
            <button type="button" onClick={openVoiceRoom} disabled={opening} className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[#f2ce6b] border border-[#f2ce6b]/45 bg-[#f2ce6b]/10 active:scale-95 transition-transform disabled:opacity-60">
              <Mic className="w-5 h-5" /> {opening ? 'Açılıyor...' : 'Sesli Sohbet Odası Aç'}
            </button>
          ) : (
            <Link to="/sesli-oda-kur" className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[#f2ce6b] border border-[#f2ce6b]/45 bg-[#f2ce6b]/10 active:scale-95 transition-transform">
              <Mic className="w-5 h-5" /> Sesli Sohbet Odası Aç
            </Link>
          )}
          {voicePreset && (
            <Link to="/sesli-oda-kur?duzenle=1" className="text-xs font-semibold text-[#f2ce6b]/75 underline">
              Sesli oda bilgilerini değiştir
            </Link>
          )}
        </div>
      </div>

      {/* Form: yalnızca oda adı sorulur, ilk kurulumda ya da adı değiştirirken görünür */}
      {formOpen && (
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5 text-gray-300">Oda Adı</label>
            <div className="relative">
              <input className={inputCls + ' pr-10'} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Cuma Gecesi Sineması" required />
              <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <button type="submit" disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Video className="w-5 h-5" /> {saving ? 'Oda açılıyor...' : 'Odayı Aç'}
          </button>
        </form>
      )}
    </div>
  );
}