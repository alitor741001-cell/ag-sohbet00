import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { AGENCY_GOLD, formatShortDiamonds, tierStyle } from '@/lib/agency';

/** Kota kademelerinin grafik renkleri (tierStyle etiketleriyle eşleşir). */
const TIER_COLORS = { BAŞLANGIÇ: '#5AB8FF', ALTIN: '#C084FC', ELMAS: '#F5C542', EFSANE: '#FF8080' };

const TOOLTIP_PROPS = {
  contentStyle: { background: '#0d0b16', border: '1px solid rgba(245,197,66,0.35)', borderRadius: 12, fontSize: 11, color: '#fff' },
  labelStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  itemStyle: { color: '#fff' },
};

const shortName = (name) => {
  const value = String(name || 'Yayıncı');
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
};

/** Ajans sahibi için yayıncı performans grafikleri: aylık elmas/hedef karşılaştırması ve kademe dağılımı. */
export default function AgencyPerformanceCharts({ members = [] }) {
  if (!members.length) return null;

  const top = members.slice(0, 6).map((member) => {
    const diamonds = Number(member.diamonds) || 0;
    return {
      name: shortName(member.name),
      elmas: diamonds,
      hedef: Math.max(Number(member.next_quota) || 0, diamonds),
    };
  });

  const tierCounts = new Map();
  members.forEach((member) => {
    const label = tierStyle(member.quota).label;
    tierCounts.set(label, (tierCounts.get(label) || 0) + 1);
  });
  const distribution = [...tierCounts.entries()].map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <header className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" style={{ color: AGENCY_GOLD }} />
          <h3 className="text-[11px] font-black uppercase tracking-wider text-white/70">Bu Ay En İyi Yayıncılar</h3>
        </header>
        <div className="mt-2 h-[196px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top} layout="vertical" margin={{ top: 4, right: 14, bottom: 0, left: 0 }} barGap={2}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={74}
                tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...TOOLTIP_PROPS}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(value, key) => [formatShortDiamonds(value), key === 'hedef' ? 'Sonraki kota' : 'Bu ay elmas']}
              />
              <Bar dataKey="hedef" fill="rgba(255,255,255,0.12)" radius={[0, 6, 6, 0]} barSize={9} />
              <Bar dataKey="elmas" fill={AGENCY_GOLD} radius={[0, 6, 6, 0]} barSize={9} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[10px] text-white/35">Altın çubuk: bu ay toplanan elmas • Gri çubuk: sonraki kota hedefi</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <header className="flex items-center gap-2">
          <PieChartIcon className="h-3.5 w-3.5" style={{ color: AGENCY_GOLD }} />
          <h3 className="text-[11px] font-black uppercase tracking-wider text-white/70">Kota Kademesi Dağılımı</h3>
        </header>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-[132px] w-[132px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={34} outerRadius={60} paddingAngle={2} stroke="none">
                  {distribution.map((slice) => (
                    <Cell key={slice.name} fill={TIER_COLORS[slice.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_PROPS} formatter={(value, name) => [`${value} yayıncı`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {distribution.map((slice) => (
              <li key={slice.name} className="flex items-center gap-2 text-[11px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TIER_COLORS[slice.name] || '#64748b' }} />
                <span className="min-w-0 flex-1 truncate text-white/60">{slice.name}</span>
                <span className="font-black text-white">{slice.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}