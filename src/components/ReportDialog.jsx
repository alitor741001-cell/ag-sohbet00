import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Flag, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const reasons = [
  'Taciz veya hakaret',
  'Uygunsuz içerik',
  'Spam veya reklam',
  'Sahte hesap',
  'Diğer',
];

export default function ReportDialog({ open, onClose, targetUserId, targetName }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await base44.functions.invoke('admin-notify', {
        event: 'user_report',
        ref_id: `report:${targetUserId}`,
        title: `Kullanıcı şikayeti: ${targetName || targetUserId}`,
        body: `Sebep: ${reason}${detail ? ` — ${detail}` : ''}`,
        link: '/admin/sikayetler',
      });
      toast({ title: 'Şikayet gönderildi', description: 'İncelenecek.' });
      setReason(''); setDetail(''); onClose();
    } catch (err) {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Flag className="w-5 h-5 text-red-400" /> Kullanıcı Şikayet Et</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{targetName} kullanıcısını şikayet etme sebebini seçin.</p>
        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <button key={r} onClick={() => setReason(r)} className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${reason === r ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-border text-muted-foreground hover:text-white'}`}>{r}</button>
          ))}
        </div>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ek detay (opsiyonel)" className="w-full bg-background border border-border rounded-lg p-3 text-sm text-white mb-4 resize-none" rows={3} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">İptal</Button>
          <Button onClick={submit} disabled={!reason || loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Şikayet Et
          </Button>
        </div>
      </div>
    </div>
  );
}