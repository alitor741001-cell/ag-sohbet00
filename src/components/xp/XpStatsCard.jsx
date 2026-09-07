import { useXp } from '@/hooks/useXp';
import { Star, Zap } from 'lucide-react';

export default function XpStatsCard({ user }) {
  const { xp, level } = useXp(user?.id);

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-purple-400" /></div>
        <div><p className="text-sm font-semibold text-white">Seviye {level}</p><p className="text-xs text-muted-foreground">{xp} XP</p></div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.min(100, (xp % 1000) / 10)}%` }} />
      </div>
    </div>
  );
}