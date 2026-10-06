import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mic, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import SeatCountPicker from '@/components/voice/SeatCountPicker';
import { VOICE_ROOM_DEFAULTS, loadRoomDefaults, saveRoomDefaults } from '@/lib/roomDefaults';

export default function VoiceRoomCreate() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  // Bütün bilgiler bir kez girilir ve otomatik kaydedilir: bir daha yazman gerekmez.
  const [saved] = useState(() => loadRoomDefaults('voice', VOICE_ROOM_DEFAULTS));
  const [seatCount, setSeatCount] = useState(Number(saved.seat_count) || 8);
  const [name, setName] = useState(saved.name || '');
  const [password, setPassword] = useState(saved.password || '');
  const [showPass, setShowPass] = useState(false);
  const [hidden, setHidden] = useState(!!saved.hidden);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      toast({ title: 'Oda adı gerekli', description: 'Sesli odana bir isim ver.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const response = await base44.functions.invoke('create-room', {
        name: name.trim(), room_type: 'voice', seat_count: seatCount, password, hidden,
      });
      const roomId = response.data?.id;
      if (!roomId) throw new Error('oda oluşturulamadı');
      // Girilen bütün bilgiler kaydedilir: sonraki sesli oda tek dokunuşla, sorulmadan açılır.
      saveRoomDefaults('voice', { name: name.trim(), password, seat_count: seatCount, hidden });
      toast({ title: 'Sesli oda açıldı' });
      navigate(`/sesli-oda/${roomId}`);
    } catch (error) {
      toast({ title: 'Oda açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-white/5 bg-[hsl(var(--secondary))] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-primary/40';

  return (
    <div className="dark mx-auto min-h-screen w-full max-w-2xl px-3 py-5 text-white sm:px-6 sm:py-7">
      <div className="mb-5 overflow-hidden rounded-2xl border border-red-500/20 p-5" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(153,27,27,0.06))' }}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <Mic className="h-6 w-6 text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">Sesli Sohbet Odası Kur</h1>
            <p className="text-sm text-gray-400">Koltukları seç, odayı aç ve arkadaşlarını yukarı çıkar.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
            <Radio className="h-4 w-4 text-primary" /> Koltuk düzeni
          </p>
          <SeatCountPicker value={seatCount} onChange={setSeatCount} />
          <p className="mt-2 text-xs text-gray-500">Seçtiğin sayı kadar mikrofon koltuğu açılır, odaya gelen herkes bir koltuğa oturup konuşabilir.</p>
        </section>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Oda adı</label>
          <input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Gece Sohbeti" maxLength={60} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Oda şifresi (opsiyonel)</label>
          <div className="relative">
            <input
              className={`${inputCls} pr-10`}
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Boş = şifresiz"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left active:scale-[0.99] transition-transform ${hidden ? 'border-primary bg-primary/10' : 'border-white/10 bg-[hsl(var(--secondary))]'}`}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${hidden ? 'bg-primary/20' : 'bg-white/5'}`}>
            <Lock className={`h-4 w-4 ${hidden ? 'text-primary' : 'text-gray-500'}`} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-white">Gizli oda</span>
            <span className="block text-xs text-gray-400">Yalnızca davet ettiğin kişiler görebilir.</span>
          </span>
          <span className={`h-5 w-5 shrink-0 rounded-full ${hidden ? 'bg-primary' : 'border border-white/20'}`} />
        </button>

        <button type="submit" disabled={saving || !user} className="w-full rounded-xl py-3.5 font-semibold text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
          {saving ? 'Oda açılıyor...' : `${seatCount} Mikrofonlu Odayı Aç`}
        </button>
      </form>
    </div>
  );
}