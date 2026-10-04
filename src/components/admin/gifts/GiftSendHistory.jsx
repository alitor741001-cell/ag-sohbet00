import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatK } from '@/lib/giftTone';

const inputClass = 'w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none';

const dateText = (value) => (value ? new Date(value).toLocaleString('tr-TR') : '—');

/** Admin: kim hangi hediyeyi kime gönderdi — tekli/toplu, K değeri ve durum bilgisiyle. */
export default function GiftSendHistory() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('all');

  useEffect(() => {
    base44.entities.GiftSend.list('-created_date', 300).then(setItems).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (mode !== 'all' && (item.mode || 'single') !== mode) return false;
      if (!needle) return true;
      return [item.sender_name, item.recipient_name, item.gift_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [items, query, mode]);

  const stats = useMemo(() => ({
    count: filtered.length,
    totalK: filtered.reduce((sum, item) => sum + (Number(item.k_value) || 0), 0),
    bulk: filtered.filter((item) => (item.mode || 'single') === 'bulk').length,
  }), [filtered]);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Kayıt</p>
          <p className="text-lg font-black tabular-nums">{stats.count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Toplam hediye değeri</p>
          <p className="text-lg font-black tabular-nums">{formatK(stats.totalK)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Toplu gönderim</p>
          <p className="text-lg font-black tabular-nums">{stats.bulk}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gönderen, alıcı veya hediye ara" className={inputClass} />
        <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
          <option value="all">Tüm gönderimler</option>
          <option value="single">Tekli</option>
          <option value="bulk">Toplu</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Gönderen</th>
                <th className="px-3 py-2">Alıcı</th>
                <th className="px-3 py-2">Hediye</th>
                <th className="px-3 py-2">K</th>
                <th className="px-3 py-2">Toplam</th>
                <th className="px-3 py-2">Tür</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{item.sender_name || '—'}</td>
                  <td className="px-3 py-2">{item.recipient_name || '—'}</td>
                  <td className="px-3 py-2">{item.gift_emoji || '🎁'} {item.gift_name || '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{formatK(item.k_value)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatK(item.total_k)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${(item.mode || 'single') === 'bulk' ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'}`}>
                      {(item.mode || 'single') === 'bulk' ? `TOPLU • ${item.recipient_count || 1}` : 'TEKLİ'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{item.status === 'success' ? 'Başarılı' : (item.status || '—')}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{dateText(item.created_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}