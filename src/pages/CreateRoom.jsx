import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { readRoomPreset, saveRoomPreset } from '@/lib/roomPreset';
import { useToast } from '@/components/ui/use-toast';
import { Users, Lock, MessageSquare, Check, Home, Settings, Eye, EyeOff, Minus, Plus, Mic, Video } from 'lucide-react';

/**
 * Oda kur sayfası: iki kısayol düğmesi ortada durur. "Kendi Odamı Aç" ilk basışta form açar;
 * girilen bilgiler kaydedilir, sonraki açılışlarda hiçbir şey sorulmadan oda doğrudan açılır.
 * "Sesli Sohbet Odası Aç" da aynı şekilde kayıtlı bilgilerle çalışır.
 */
export default function CreateRoom() {
  const navigate = useNavigate();
  const { user, setUser } = useCurrentUser();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', password: '', max_users: 10, chat_enabled: true, hidden: false });
  const [formOpen, setFormOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const prefilled = useRef(false);
  const filmPreset = readRoomPreset(user, 'film');
  const voicePreset = readRoomPreset(user, 'voice');

  // Kayıtlı bilgiler forma hazır gelir: düzenlerken tekrar yazmak gerekmez.
  useEffect(() => {
    if (prefilled.current || !filmPreset) return;
    prefilled.current = true;
    setForm({
      name: filmPreset.name || '',
      password: filmPreset.password || '',
      max_users: Number(filmPreset.max_users) || 10,
      chat_enabled: filmPreset.chat_enabled !== false,
      hidden: !!filmPreset.hidden,
    });
  }, [filmPreset]);

  const presetSettings = (preset) => ({
    name: preset.name || '',
    password: preset.password || '',
    max_users: Number(preset.max_users) || 10,
    chat_enabled: preset.chat_enabled !== false,
    hidden: !!preset.hidden,
  });

  // Kişisel oda kayıtlı bilgilerle açılır: aynı oda her seferinde bu ayarlarla gelir.
  const openMyRoom = async (settings) => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await base44.functions.invoke('personal-room', { settings });
      navigate(`/oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  // Kayıtlı bilgi varsa hiçbir şey sorulmadan oda açılır; yoksa form gösterilir.
  const handleMyRoom = () => {
    if (opening) return;
    if (filmPreset && !formOpen) { openMyRoom(presetSettings(filmPreset)); return; }
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) { toast({ title: 'Oda adı gerekli', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const settings = {
        name: form.name.trim(), password: form.password, max_users: Number(form.max_users),
        chat_enabled: form.chat_enabled, hidden: form.hidden,
      };
      const res = await base44.functions.invoke('personal-room', { settings });
      // Girilen bilgiler otomatik kaydedilir: sonraki açılışta hiçbir şey sorulmaz.
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
        password: voicePreset.password || '', hidden: !!voicePreset.hidden,
      });
      navigate(`/sesli-oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  const inputCls = "w-full bg-[hsl(var(--secondary))] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#f2ce6b]/40 border border-[#f2ce6b]/20 placeholder:text-gray-500";

  const toggleCards = [
    { key: 'chat_enabled', icon: MessageSquare, label: 'Sohbet açık' },
    { key: 'hidden', icon: Lock, label: 'Gizli oda' },
  ];

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
          <p className="text-xs text-gray-400">Oda bilgileri bir kez girilir; sonraki açılışlarda tekrar sorulmaz.</p>
        </div>

        <div className="relative mt-5 flex flex-col items-stretch gap-2">
          <button onClick={handleMyRoom} disabled={opening} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Home className="w-5 h-5" /> {opening ? 'Açılıyor...' : 'Kendi Odamı Aç'}
          </button>
          {filmPreset && !formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className="text-xs font-semibold text-[#f2ce6b]/75 underline">
              Oda bilgilerini değiştir
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

      {/* Form: yalnızca "Kendi Odamı Aç" ilk kez basıldığında veya düzenleme istendiğinde görünür */}
      {formOpen && (
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5 text-gray-300">Oda Adı</label>
            <div className="relative">
              <input className={inputCls + ' pr-10'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Cuma Gecesi Sineması" required />
              <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <div>
              <label className="text-sm font-medium block mb-1.5 text-gray-300">Şifre (opsiyonel)</label>
              <div className="relative">
                <input className={inputCls + ' pr-10'} type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Boş = şifresiz" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button type="button" onClick={() => setForm({ ...form, password: Math.random().toString(36).slice(2, 8).toUpperCase() })} className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-[#f2ce6b]/45 text-[#f2ce6b] hover:bg-[#f2ce6b]/10">Oluştur</button>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5 text-gray-300">Maks. Kullanıcı</label>
              <div className="flex items-center gap-2 bg-[hsl(var(--secondary))] rounded-xl border border-white/5 px-2 py-2">
                <button type="button" onClick={() => setForm({ ...form, max_users: Math.max(2, Number(form.max_users) - 1) })} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10"><Minus className="w-4 h-4" /></button>
                <span className="flex-1 text-center text-sm font-bold">{form.max_users}</span>
                <button type="button" onClick={() => setForm({ ...form, max_users: Math.min(250, Number(form.max_users) + 1) })} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {toggleCards.map(({ key, icon: Icon, label }) => {
              const active = form[key];
              return (
                <button key={key} type="button" onClick={() => setForm({ ...form, [key]: !active })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${active ? 'border-[#f2ce6b] bg-[#f2ce6b]/10' : 'border-white/10 bg-[hsl(var(--secondary))]'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-[#f2ce6b]' : 'border border-white/20'}`}>
                    {active && <Check className="w-3 h-3 text-black" />}
                  </span>
                  <Icon className={`w-5 h-5 ${active ? 'text-[#f2ce6b]' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium text-center ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                </button>
              );
            })}
          </div>

          <button type="submit" disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <Video className="w-5 h-5" /> {saving ? 'Oda açılıyor...' : 'Odayı Aç'}
          </button>
        </form>
      )}
    </div>
  );
}