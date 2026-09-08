import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useFrameCatalog } from '@/lib/FrameCatalogContext';
import { Image } from '@/components/ui/image';
import usePreparedPortrait from '@/components/xp/usePreparedPortrait';
import PortraitPhoto from '@/components/profile/PortraitPhoto';
import { Minus, Plus, Upload, Save, RotateCcw, Move, ChevronDown, X } from 'lucide-react';

// Profil fotoğrafını çerçeve içinde sürükleyerek kaydırma ve yakınlaştırma aracı.
// `targetUserId` verilirse admin modu (başka kullanıcının profilini düzenler), yoksa kendi profili.
export default function AvatarPositioner({ user, targetUserId, onSaved }) {
  const { toast } = useToast();
  const { frames } = useFrameCatalog();
  const frame = user.profile_frame;
  const info = frame ? frames[frame] : null;
  const portrait = usePreparedPortrait(info?.image_url, info?.opening);
  const isAdmin = !!targetUserId && targetUserId !== user?.id;
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [scale, setScale] = useState(user.profile_frame_scale || 100);
  const [panX, setPanX] = useState(user.profile_avatar_x || 0);
  const [panY, setPanY] = useState(user.profile_avatar_y || 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const windowRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, width: 1 });

  if (!info) return <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Çerçeve takılı değil. Önce bir çerçeve seçin, sonra fotoğrafı konumlandırabilirsiniz.</p>;

  const [left, top, openingWidth, openingHeight] = portrait?.bounds || info.opening;
  const effectiveScale = Math.max(100, Number(scale) || 100);
  const panLimit = (1 - 100 / effectiveScale) * 50;
  const boundedX = Math.max(-panLimit, Math.min(panLimit, panX));
  const boundedY = Math.max(-panLimit, Math.min(panLimit, panY));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setAvatar(file_url); }
    catch { toast({ title: 'Yükleme hatası', variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const onPointerDown = (e) => {
    const rect = windowRef.current?.getBoundingClientRect();
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, origX: boundedX, origY: boundedY, width: rect?.width || 1, height: rect?.height || 1 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const s = effectiveScale / 100;
    const dx = ((e.clientX - drag.current.startX) / drag.current.width) * 100 / s;
    const dy = ((e.clientY - drag.current.startY) / drag.current.height) * 100 / s;
    setPanX(Math.max(-panLimit, Math.min(panLimit, drag.current.origX + dx)));
    setPanY(Math.max(-panLimit, Math.min(panLimit, drag.current.origY + dy)));
  };
  const onPointerUp = (e) => { drag.current.active = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { avatar, profile_frame_scale: effectiveScale, profile_avatar_x: boundedX, profile_avatar_y: boundedY };
      if (isAdmin) await base44.entities.User.update(targetUserId, payload);
      else await base44.functions.invoke('update-profile', payload);
      await onSaved?.();
      toast({ title: 'Profil fotoğrafı konumu kaydedildi' });
    } catch (e) { toast({ title: 'Kaydedilemedi', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const reset = () => { setScale(100); setPanX(0); setPanY(0); };

  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between gap-2">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-bold"><ChevronDown className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} />Fotoğraf Konumlandırma{isAdmin ? ' (Admin)' : ''}</button>
      <div className="flex items-center gap-2">
        <button onClick={reset} className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />Sıfırla</button>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg bg-secondary p-2 text-muted-foreground" aria-label={open ? 'Kapat' : 'Aç'}><X className="w-4 h-4" /></button>
      </div>
    </div>
    {open && <><p className="mt-1 text-xs text-muted-foreground">Yakınlaştırıp sürükleyerek konumlandır; fotoğraf çerçevenin içini boşluksuz doldurur.</p>
    {!portrait && <p role="status" className="mt-2 text-xs text-muted-foreground">Çerçeve hazırlanıyor...</p>}
    <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative h-56 w-56 shrink-0 select-none" style={{ touchAction: 'none' }}>
        <PortraitPhoto portrait={portrait} avatar={avatar} name={user.username || user.full_name} scale={effectiveScale} panX={boundedX} panY={boundedY} />
        {portrait && <Image src={portrait.src} alt="" aria-hidden="true" loading="eager" fittingType="fit" className="pointer-events-none absolute inset-0 h-full w-full" />}
        <div ref={windowRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="absolute cursor-grab active:cursor-grabbing" style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${openingWidth * 100}%`, height: `${openingHeight * 100}%` }} />
      </div>
      <div className="w-full max-w-xs space-y-3">
        <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3 text-sm font-semibold cursor-pointer">
          <Upload className="w-4 h-4" /> {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold"><span className="flex items-center gap-1"><Move className="w-3 h-3" />Kaydır (X)</span><span>{Math.round(boundedX)}</span></div>
          <input type="range" min={-panLimit} max={panLimit} step="0.1" value={boundedX} onChange={(e) => setPanX(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold"><span>Kaydır (Y)</span><span>{Math.round(boundedY)}</span></div>
          <input type="range" min={-panLimit} max={panLimit} step="0.1" value={boundedY} onChange={(e) => setPanY(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold"><span>Yakınlaştır</span><span>%{effectiveScale}</span></div>
          <div className="flex items-center gap-2"><button onClick={() => setScale((s) => Math.max(100, s - 5))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border"><Minus className="w-4 h-4" /></button><input type="range" min="100" max="180" step="1" value={effectiveScale} onChange={(e) => setScale(Number(e.target.value))} className="flex-1 accent-primary" /><button onClick={() => setScale((s) => Math.min(180, s + 5))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border"><Plus className="w-4 h-4" /></button></div>
        </div>
        <button onClick={save} disabled={saving} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4" />{saving ? 'Kaydediliyor...' : 'Konumu Kaydet'}</button>
      </div>
    </div></>}
  </section>;
}