import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Users, Lock, MessageSquare, Mic, Check, Home, Settings, Eye, EyeOff, Link2, Minus, Plus, Video } from 'lucide-react';
import { youtubeIdFromUrl } from '@/lib/mediaSource';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  // Oda adı yalnızca ilk kurulumda sorulur: sonraki kurulumlarda hatırlanan ad yazılı gelir,
  // adı odanın içindeki ayarlardan değiştirebilirsin.
  const [form, setForm] = useState(() => ({
    name: typeof localStorage === 'undefined' ? '' : (localStorage.getItem('filmkeyfi_roomname_film') || ''),
    youtube_link: '', password: '', max_users: 10, chat_enabled: true, voice_enabled: false, hidden: false,
  }));
  const [nameEdited, setNameEdited] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name) { toast({ title: 'Oda adı gerekli', variant: 'destructive' }); return; }
    // YouTube linki odanın ekranına yazılır; link yoksa video odaya girince seçilir.
    const link = form.youtube_link.trim();
    const videoId = link ? youtubeIdFromUrl(link) : '';
    if (link && !videoId) { toast({ title: 'Geçerli bir YouTube linki gir', variant: 'destructive' }); return; }
    const voiceOnly = !videoId && form.voice_enabled;
    setSaving(true);
    try {
      const res = await base44.functions.invoke('create-room', voiceOnly
        ? { name: form.name, room_type: 'voice', password: form.password, hidden: form.hidden }
        : {
            name: form.name, movie_id: videoId ? `yt:${videoId}` : 'yt:', movie_title: videoId ? 'YouTube' : '',
            password: form.password, max_users: Number(form.max_users),
            chat_enabled: form.chat_enabled, voice_enabled: form.voice_enabled, hidden: form.hidden
          });
      localStorage.setItem('filmkeyfi_roomname_film', form.name.trim());
      toast({ title: voiceOnly ? 'Sesli oda oluşturuldu' : 'Oda oluşturuldu' });
      navigate(voiceOnly ? `/sesli-oda/${res.data.id}` : `/oda/${res.data.id}`);
    } catch (err) { toast({ title: 'Hata', description: err.response?.data?.error || err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const openMyRoom = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await base44.functions.invoke('personal-room', {});
      navigate(`/oda/${res.data.id}`);
    } catch (e) {
      toast({ title: 'Oda açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setOpening(false); }
  };

  const inputCls = "w-full bg-[hsl(var(--secondary))] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#f2ce6b]/40 border border-[#f2ce6b]/20 placeholder:text-gray-500";

  const toggleCards = [
    { key: 'chat_enabled', icon: MessageSquare, label: 'Sohbet açık' },
    { key: 'voice_enabled', icon: Mic, label: 'Sesli sohbet' },
    { key: 'hidden', icon: Lock, label: 'Gizli oda' },
  ];

  return (
    <div className="dark mx-auto w-full max-w-3xl px-3 py-5 text-white sm:px-6 sm:py-7">
      {/* Hero Panel */}
      <div className="relative rounded-2xl overflow-hidden mb-6 p-5" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.16), rgba(242,206,107,0.08))', border: '1px solid rgba(242,206,107,0.28)' }}>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl opacity-30" style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />
        <div className="relative flex items-center gap-4">
          <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.35), rgba(242,206,107,0.25))' }}>
            <Users className="w-6 h-6 text-[#f2ce6b]" />
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold">Oda Kur</h1>
            <p className="text-sm text-gray-400">Arkadaşlarınla birlikte izlemek için bir Watch Party odası oluştur.</p>
          </div>
        </div>
        <button onClick={openMyRoom} disabled={opening} className="relative mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
          <Home className="w-5 h-5" /> {opening ? 'Açılıyor...' : 'Kendi Odamı Aç'}
        </button>
        <Link to="/sesli-oda-kur" className="relative mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[#f2ce6b] border border-[#f2ce6b]/45 bg-[#f2ce6b]/10 active:scale-95 transition-transform">
          <Mic className="w-5 h-5" /> Sesli Sohbet Odası Aç
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Oda Adı */}
        <div>
          <label className="text-sm font-medium block mb-1.5 text-gray-300">Oda Adı</label>
          <div className="relative">
            <input className={inputCls + ' pr-10'} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setNameEdited(true); }} placeholder="Örn: Cuma Gecesi Sineması" required />
            <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* YouTube Linki */}
        <div>
          <label className="text-sm font-medium block mb-1.5 text-gray-300">YouTube Linki (opsiyonel)</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className={inputCls + ' pl-9'} value={form.youtube_link} onChange={(e) => setForm({ ...form, youtube_link: e.target.value })} placeholder="https://youtube.com/watch?v=..." inputMode="url" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Link bırakırsan video oda ekranında herkes için tam ekran oynar; boş bırakırsan odaya girince seçebilirsin.</p>
        </div>

        {/* Advanced Options */}
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

        {Number(form.max_users) > 100 && <p className="text-xs text-amber-500 -mt-1">⚠️ Yüksek kapasite: çok sayıda katılımcı oda performansını etkileyebilir.</p>}

        {/* Toggle Cards */}
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
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

        {/* Link yoksa oda sesli sohbet odası olarak açılır */}
        {form.voice_enabled && !form.youtube_link.trim() && (
          <p className="text-xs text-amber-400">Link yoksa bu oda sesli sohbet odası olarak açılır; burada video oynatılmaz.</p>
        )}

        {/* Submit */}
        <button type="submit" disabled={saving || !user} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
          <Video className="w-5 h-5" /> {saving ? 'Oda oluşturuluyor...' : 'Odayı Oluştur'}
        </button>
      </form>
    </div>
  );
}