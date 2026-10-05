import { useState } from 'react';
import { Building2, ImagePlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import AgencySheet from '@/components/agency/AgencySheet';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/** Yeni ajans oluşturma formu: ad, açıklama, logo ve ajans kimliği. */
export default function AgencyCreateSheet({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast({ title: 'PNG, JPG veya WebP seçin', variant: 'destructive' });
      event.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setLogo(file_url);
    } catch (error) {
      toast({ title: 'Logo yüklenemedi', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const submit = async () => {
    if (saving) return;
    if (name.trim().length < 3) {
      toast({ title: 'Ajans adı en az 3 karakter olmalı', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const data = await agencyApi('create', { name: name.trim(), description: description.trim(), logo });
      setCreated(data.agency);
      onCreated?.(data.agency);
      toast({ title: 'Ajans oluşturuldu', description: `Ajans kimliği: ${data.agency?.agency_id}` });
    } catch (error) {
      toast({ title: 'Ajans oluşturulamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AgencySheet open={open} onClose={onClose} icon={Building2} title="🏢 Ajans Oluştur" subtitle="Kendi ajansını kur ve yayıncı davet et">
      {created ? (
        <div className="space-y-3 pb-2">
          <div className="rounded-2xl border border-[#F5C542]/45 bg-gradient-to-br from-[#2a1f06] to-[#0b0910] p-5 text-center">
            <p className="text-xs font-semibold text-white/60">Ajansın hazır 🎉</p>
            <p className="mt-1 text-lg font-black text-white">{created.name}</p>
            <p className="mt-3 text-[11px] uppercase tracking-widest text-white/45">Ajans Kimliği</p>
            <p className="text-2xl font-black" style={{ color: AGENCY_GOLD }}>{created.agency_id}</p>
            <p className="mt-2 text-[11px] text-white/50">Bu kimliği paylaşarak yayıncılara ulaşabilirsin.</p>
          </div>
          <button onClick={onClose} className="w-full rounded-2xl py-3.5 text-sm font-black text-black" style={{ background: AGENCY_GOLD }}>
            Tamam
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#F5C542]/40 bg-black/50">
              {logo ? <Image src={logo} className="h-full w-full object-cover" fittingType="fill" /> : <ImagePlus className="h-5 w-5 text-[#F5C542]" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Ajans Logosu</span>
              <span className="block text-[11px] text-white/50">{uploading ? 'Yükleniyor...' : 'PNG, JPG veya WebP seç'}</span>
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} disabled={uploading} />
          </label>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">Ajans Adı</p>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Örn: Gece Yıldızları" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#F5C542]/60" />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">Açıklama</p>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={400} placeholder="Ajansın hakkında kısa bir tanıtım" className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#F5C542]/60" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Ajans Sahibi</p>
            <p className="mt-1 text-sm font-semibold">Sen ({name.trim() ? 'kurucu' : 'kurucu'})</p>
            <p className="mt-1 text-[11px] text-white/45">Ajans kimliği oluşturulduğunda otomatik üretilir.</p>
          </div>

          <div className="rounded-2xl border border-[#F5C542]/25 bg-[#F5C542]/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C542]">Ajans Sözleşmesi</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              Her 200.000 elmas için ajans komisyonu <span className="font-bold text-white">$3</span>. Yayıncı kazançları kota tablosuna göre hesaplanır; tüm işlemler sistem kaydına geçer.
            </p>
          </div>

          <button onClick={submit} disabled={saving || uploading} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />} Ajansı Oluştur
          </button>
        </div>
      )}
    </AgencySheet>
  );
}