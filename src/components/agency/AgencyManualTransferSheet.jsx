import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FileImage, Loader2, MoveRight, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import AgencySheet from '@/components/agency/AgencySheet';
import { AGENCY_GOLD, TRANSFER_LABELS, agencyApi, dateText } from '@/lib/agency';

/**
 * Normal transfer: ajans sahibi engellenmiş ya da hesabını kapatmışsa sahip onayı
 * alınamaz. Yayıncı hedef ajansı ve bir fotoğrafı gönderir; yönetici onayladığında
 * eski ajans etiketi kalkar, yeni ajansın etiketi gelir.
 * Fotoğraf özel alana yüklenir: yalnızca yönetici incelemesi sırasında imzalı
 * bağlantıyla açılır.
 */
export default function AgencyManualTransferSheet({ open, onClose, onChanged }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [code, setCode] = useState('');
  const [target, setTarget] = useState(null);
  const [photoUri, setPhotoUri] = useState('');
  const [note, setNote] = useState('');
  const [looking, setLooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [mine, setMine] = useState([]);

  const load = useCallback(() => {
    agencyApi('transfers').then((data) => setMine(data.manual || [])).catch(() => {});
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const lookup = async () => {
    const value = code.trim().toUpperCase();
    if (!value || looking) return;
    setLooking(true);
    setTarget(null);
    try {
      const data = await agencyApi('agency-lookup', { agency_code: value });
      setTarget(data.agency || null);
    } catch (error) {
      toast({ title: 'Ajans bulunamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setLooking(false); }
  };

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setPhotoUri(file_uri);
    } catch (error) {
      toast({ title: 'Fotoğraf yüklenemedi', description: error.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const send = async () => {
    if (!target || !photoUri || busy) return;
    setBusy(true);
    try {
      await agencyApi('manual-transfer-request', { agency_code: target.agency_id, photo_uri: photoUri, note });
      toast({ title: 'Talep gönderildi', description: 'Yönetici incelemesinden sonra yeni ajansına geçersin.' });
      setCode(''); setTarget(null); setPhotoUri(''); setNote('');
      load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'Talep gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const cancel = async (transfer) => {
    setBusyId(transfer.id);
    try {
      await agencyApi('manual-transfer-cancel', { transfer_id: transfer.id });
      toast({ title: 'Talep iptal edildi' });
      load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'İptal edilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  return (
    <AgencySheet
      open={open}
      tall
      onClose={onClose}
      icon={FileImage}
      title="📄 Normal Transfer"
      subtitle="Sahip onayı olmadan, fotoğraflı talep yönetici incelemesiyle tamamlanır"
    >
      <div className="space-y-4 pb-2">
        <div className="rounded-2xl border border-[#FF8080]/35 bg-gradient-to-br from-[#2a0b10] to-[#0b0910] p-3">
          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-white/70">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF8080]" />
            Ajans sahibi engellendiyse ya da hesabını kapattıysa normal transferi kullan. Fotoğrafı ve hedef ajansı gönder;
            yönetici onayladığında eski ajans etiketi kalkar, yeni ajansın etiketi gelir, eski ajandaki asistanlık da sona erer.
          </p>
        </div>

        <div className="rounded-2xl border border-[#5AB8FF]/35 bg-gradient-to-br from-[#0b1b2c] to-[#0b0910] p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5AB8FF]">Yeni Ajans Kimliği</p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(event) => { setCode(event.target.value.toUpperCase()); setTarget(null); }}
              placeholder="AG-000000"
              maxLength={9}
              className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/50 px-4 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-[#5AB8FF]/70"
            />
            <button onClick={lookup} disabled={looking || code.trim().length < 3} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 px-3.5 py-2.5 text-xs font-bold disabled:opacity-50">
              {looking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Sorgula
            </button>
          </div>
          {target && (
            <p className="mt-2 truncate text-xs font-bold" style={{ color: AGENCY_GOLD }}>
              {target.name} • {target.agency_id} • Sahip: {target.owner_name || '—'}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/12 bg-black/40 p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-white/60">İnceleme Fotoğrafı</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 py-4 text-xs font-bold text-white/70 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {photoUri ? 'Fotoğraf yüklendi • değiştir' : 'Fotoğraf çek / seç'}
          </button>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Kısa açıklama (isteğe bağlı): sahibi engellendi / hesabını kapattı"
            className="mt-2 w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2 text-xs outline-none focus:border-[#F5C542]/60"
          />
          <button
            onClick={send}
            disabled={!target || !photoUri || busy}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5C542] to-[#d9a51c] py-3.5 text-sm font-black text-black disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />} Talebi Gönder
          </button>
        </div>

        {mine.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Normal Transfer Taleplerim</p>
            <div className="space-y-2">
              {mine.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">
                      {row.from_agency_name || 'Eski ajans'} → {row.to_agency_name}
                    </span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${row.status === 'pending' ? 'border-[#F5C542]/45 text-[#F5C542]' : row.status === 'completed' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/45'}`}>
                      {TRANSFER_LABELS[row.status] || row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/45">{dateText(row.created_date)} • Yönetici incelemesi</p>
                  {row.admin_note && <p className="mt-1 text-[10px] text-[#FF8080]">Not: {row.admin_note}</p>}
                  {row.status === 'pending' && (
                    <button onClick={() => cancel(row)} disabled={busyId === row.id} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 py-2 text-[11px] font-bold text-white/60 disabled:opacity-50">
                      {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Talebi iptal et
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AgencySheet>
  );
}