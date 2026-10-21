import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useXp from '@/hooks/useXp';
import { formatXp } from '@/lib/xp';

/** Seviye penceresi: toplam XP, mevcut çerçeve ve bir sonraki seviyeye kalan puan. */
export default function LevelDialog({ open, onClose, userId }) {
  const stats = useXp([userId])[userId];
  const percent = stats?.percent ?? 0;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] text-white">
        <DialogHeader>
          <DialogTitle className="text-[#a5e4ff]">Seviye</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold text-white/80">{stats?.frame?.name || 'Başlangıç'}</span>
            <span className="text-2xl font-extrabold tabular-nums text-white">{formatXp(stats?.xp ?? 0)} XP</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #38bdf8, #7dd3fc)' }} />
          </div>
          <p className="text-xs text-white/70">
            {stats?.nextFrame
              ? `Sonraki seviye "${stats.nextFrame.name}" — ${formatXp(stats.remaining)} XP kaldı.`
              : 'Ulaşılabilecek en yüksek seviyedesiniz.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}