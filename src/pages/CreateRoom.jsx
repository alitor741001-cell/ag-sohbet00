import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { readRoomPreset, saveRoomPreset } from '@/lib/roomPreset';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import SeatCountPicker from '@/components/voice/SeatCountPicker';
import RoomAutoOpen from '@/components/home/RoomAutoOpen';
import { ROOM_BACKGROUNDS, ROOM_TYPES, backgroundCss } from '@/lib/roomBackgrounds';

const LABEL = 'mb-2 flex items-center gap-1.5 text-sm font-bold text-white';
const INPUT = 'w-full rounded-2xl border border-white/10 bg-[#252525] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#6c4bff]/70';

/**
 * Oda kur: kapak görseli, oda adı, oda türü ve arka plan seçilir; onaylandığında
 * oda doğrudan açılır (ara adım yok). Girilen bilgiler hatırlanır.
 */
export default function CreateRoom() {
  const navigate = useNavigate();
  const { user, setUser } = useCurrentUser();
  const { toast } = useToast();
  const preset = readRoomPreset(user, 'voice');
  // Düzenleme istenmediyse ve bilgiler kayıtlıysa form hiç gösterilmez: oda doğrudan açılır.
  const editing = new URLSearchParams(window.location.search).get('duzenle') === '1';
  const [formRequested, setFormRequested] = useState(false);

  const [name, setName] = useState('');
  const [cover, setCover] = useState('');
  const [type, setType] = useState('all');
  const [background, setBackground] = useState(ROOM_BACKGROUNDS[0].key);
  const [seatCount, setSeatCount] = useState(8);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const prefilled = useRef(false);

  // Kayıtlı bilgiler forma hazır gelir: aynı ayarları tekrar girmek gerekmez.
  useEffect(() => {
    if (prefilled.current || !preset) return;
    prefilled.current = true;
    setName(preset.name || '');
    setCover(preset.cover_url || '');
    setBackground(preset.background || ROOM_BACKGROUNDS[0].key);
    setSeatCount(Number(preset.seat_count) || 8);
  }, [preset]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const onCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setCover(file_url);
    } catch (error) {
      toast({ title: 'Görsel yüklenemedi', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) {
      toast({ title: 'Oda adı gerekli', description: 'Odanıza bir isim verin.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const settings = {
      name: name.trim(),
      seat_count: seatCount,
      background,
      cover_url: cover,
      voice: true,
    };
    try {
      const res = await base44.functions.invoke('personal-room', { settings });
      await saveRoomPreset('voice', { name: settings.name, seat_count: seatCount, background, cover_url: cover }, setUser);
      navigate(`/sesli-oda/${res.data.id}`);
    } catch (error) {
      toast({ title: 'Oda açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
      setSaving(false);
    }
  };

  const visible = type === 'all' ? ROOM_BACKGROUNDS : ROOM_BACKGROUNDS.filter((item) => item.type === type);

  // Bilgiler bir kez girildiyse oda beklemeden açılır; açılamazsa forma düşülür.
  if (preset && !editing && !formRequested) {
    return <RoomAutoOpen preset={preset} onFailed={() => setFormRequested(true)} />;
  }

  return (
    <div
      className="dark min-h-screen text-white"
      style={{ background: 'radial-gradient(120% 70% at 50% 0%, #241c40 0%, #14131c 46%, #0c0c10 100%)' }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-[#101018]/92 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 text-center text-base font-extrabold">Oda Oluştur</h1>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-5 md:max-w-lg">
        {/* Kapak görseli: dokununca galeriden seçilir. */}
        <label
          className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-white/10"
          style={{ background: cover ? '#161616' : 'linear-gradient(135deg,#2a2833,#17161d)' }}
        >
          {cover ? (
            <Image src={cover} alt="Oda kapağı" fittingType="fill" className="absolute inset-0 h-full w-full" />
          ) : null}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/12 backdrop-blur">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          </span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onCover} disabled={uploading} />
        </label>

        <div>
          <p className={LABEL}>
            <Sparkles className="h-4 w-4 text-[#a68bff]" /> Oda Adı
          </p>
          <div className="relative">
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 30))}
              placeholder="Oda adını girin"
              maxLength={30}
              className={`${INPUT} pr-14`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-white/40">
              {name.length}/30
            </span>
          </div>
        </div>

        <div>
          <p className={LABEL}>
            <Sparkles className="h-4 w-4 text-[#a68bff]" /> Oda Türü
          </p>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((item) => {
              const active = type === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setType(item.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${active ? 'text-white' : 'bg-[#252525] text-white/60'}`}
                  style={active ? { background: 'linear-gradient(135deg,#6c4bff,#3b6bff)' } : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={LABEL}>
            <Sparkles className="h-4 w-4 text-[#a68bff]" /> Oda Arka Planı
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {visible.map((item) => {
              const active = background === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setBackground(item.key)}
                  className="relative flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <span
                    className={`relative flex h-24 w-full items-end justify-center overflow-hidden rounded-2xl ${active ? 'ring-2 ring-[#3b8bff]' : 'ring-1 ring-white/10'}`}
                    style={{ background: item.background }}
                  >
                    <Image src={item.image} alt={item.label} fittingType="fill" className="absolute inset-0 h-full w-full" />
                    <span className="relative w-full bg-black/35 px-1 py-1 text-center text-[9.5px] font-bold text-white">{item.label}</span>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3b8bff]">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={LABEL}>
            <Sparkles className="h-4 w-4 text-[#a68bff]" /> Mikrofon Bölümü
          </p>
          <SeatCountPicker value={seatCount} onChange={setSeatCount} />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          className="w-full rounded-2xl py-3.5 text-sm font-extrabold text-white transition active:scale-[0.99] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg,#6c4bff,#3b6bff 55%,#2e7dff)',
            boxShadow: '0 12px 28px -12px rgba(70,100,255,0.9)',
          }}
        >
          {saving ? 'Oda açılıyor...' : 'Onayla'}
        </button>
        <div className="h-1 rounded-full" style={{ background: backgroundCss(background), opacity: 0.4 }} />
      </div>
    </div>
  );
}