import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Ban, Check, ShieldOff, Trash2, User } from 'lucide-react';
import SupportAttachment from '@/components/support/SupportAttachment';
import { useToast } from '@/components/ui/use-toast';

const CONTEXT = { dm: 'Özel Mesaj', room: 'Oda', profile: 'Profil' };
const STATUS = {
  pending: { label: 'Bekliyor', className: 'bg-amber-500/20 text-amber-300' },
  reviewed: { label: 'İncelendi', className: 'bg-blue-500/20 text-blue-300' },
  resolved: { label: 'Çözüldü', className: 'bg-green-500/20 text-green-300' },
};

/** Canlı destek panelindeki şikayet ayrıntısı: durum güncellenir, şikayet edilene işlem yapılır. */
export default function ReportDetail({ report, onBack, onProfile, openAction, acting }) {
  const { toast } = useToast();
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!report?.target_id) { setTarget(null); return; }
    base44.entities.User.get(report.target_id).then(setTarget).catch(() => setTarget(null));
  }, [report?.target_id]);

  const setStatus = async (status) => {
    try { await base44.entities.Report.update(report.id, { status }); toast({ title: 'Şikayet güncellendi' }); }
    catch { toast({ title: 'Güncellenemedi', variant: 'destructive' }); }
  };

  const badge = STATUS[report.status] || STATUS.pending;
  const targetUser = { id: report.target_id, username: report.target_name };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-3 py-2">
        <button onClick={onBack} className="text-white/40 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
        <p className="text-xs font-bold text-white">Şikayet</p>
        <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        <div className="flex items-start gap-2">
          {target?.avatar
            ? <img src={target.avatar} className="w-9 h-9 shrink-0 rounded-full object-cover" />
            : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/80 text-[11px] font-bold text-white">{(report.target_name || '?')[0].toUpperCase()}</div>}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{report.target_name || 'Bilinmeyen kullanıcı'}</p>
            <p className="truncate text-[10px] text-white/40">{CONTEXT[report.context] || report.context || 'Şikayet'}{target?.member_id ? ` · #${target.member_id}` : ''}</p>
          </div>
        </div>
        <p className="text-[11px] text-white/50">Şikayet eden: <span className="text-white/80">{report.reporter_name || '-'}</span></p>
        {report.reason && <p className="rounded-lg bg-[#1f1f1f] p-2 text-[11px] text-white/70">{report.reason}</p>}
        <SupportAttachment message={report} className="max-h-32 max-w-full rounded-lg" />
        <p className="text-[10px] text-white/30">{report.created_date ? new Date(report.created_date).toLocaleString('tr-TR') : ''}</p>
      </div>

      <div className="space-y-1.5 border-t border-[#2a2a2a] p-2">
        {report.status === 'pending' && (
          <button onClick={() => setStatus('reviewed')} disabled={acting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/20 py-2 text-xs font-semibold text-blue-300 disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />İncelendi
          </button>
        )}
        {report.status !== 'resolved' && (
          <button onClick={() => setStatus('resolved')} disabled={acting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500/20 py-2 text-xs font-semibold text-green-300 disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />Çözüldü
          </button>
        )}
        {target && (
          <button onClick={() => onProfile(target)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-semibold text-white/80">
            <User className="w-3.5 h-3.5" />Profili Aç
          </button>
        )}
        <button onClick={() => openAction('ban', targetUser)} disabled={acting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 text-xs font-semibold text-red-400 disabled:opacity-50">
          <Ban className="w-3.5 h-3.5" />Engelle
        </button>
        <button onClick={() => openAction('suspend', targetUser)} disabled={acting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/20 py-2 text-xs font-semibold text-amber-400 disabled:opacity-50">
          <ShieldOff className="w-3.5 h-3.5" />Askıya Al
        </button>
        <button onClick={() => openAction('delete', targetUser)} disabled={acting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 text-xs font-semibold text-red-400 disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" />Kullanıcıyı Sil
        </button>
      </div>
    </div>
  );
}