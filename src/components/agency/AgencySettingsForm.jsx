import { useState } from 'react';
import { ImagePlus, Loader2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/** Ajans ayarları: ad, açıklama, logo ve sözleşme kuralları. */
export default function AgencySettingsForm({ agency = {}, onSaved }) {
  const { toast } = useToast();
  const [name, setName] = useState(agency.name || '');
  const [description, setDescription] = useState(agency.description || '');
  const [rules, setRules] = useState(agency.rules || '');
  const [logo, setLogo] = useState(agency.logo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await agencyApi('update', { name, description, rules, logo });
      toast({ title: 'Ajans ayarları güncellendi' });
      onSaved?.();
    } catch (error) {
      toast({ title: 'Kaydedilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#F5C542]/40 bg-black/50">
          {logo ? <Image src={logo} className="h-full w-full object-cover" fittingType="fill" /> : <ImagePlus className="h-5 w-5 text-[#F5C542]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Ajans Logosu</span>
          <span className="block text-[11px] text-white/50">{uploading ? 'Yükleniyor...' : 'Değiştirmek için dokun'}</span>
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} disabled={uploading} />
      </label>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">Ajans Adı</p>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#F5C542]/60" />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">Açıklama</p>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={400} className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#F5C542]/60" />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">Ajans Kuralları</p>
        <textarea value={rules} onChange={(event) => setRules(event.target.value)} rows={7} className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-[11px] leading-relaxed outline-none focus:border-[#F5C542]/60" />
        <p className="mt-1 text-[10px] text-white/40">Davet ekranında yayıncı adayına gösterilir.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-white/45">Ajans Kimliği</p>
        <p className="text-sm font-black" style={{ color: AGENCY_GOLD }}>{agency.agency_id}</p>
      </div>
      <button onClick={save} disabled={saving || uploading} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
      </button>
    </div>
  );
}