import React from 'react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from './rocketConfig';

// Tasarımdaki liste alanı: yalnız burası kayar, oyun alanı yerinde kalır.
const BAND = { left: 36, top: 378, width: 218, height: 742 };
const ROW_HEIGHT = 88;

function rowsOf(bets) {
  const rows = (bets || []).map((b, index) => ({
    key: b.id || `${b.user_id}:${b.slot ?? 1}:${index}`,
    user_id: b.user_id,
    name: (b.user_name || 'Oyuncu').trim(),
    avatar: b.user_avatar,
    amount: b.bet || 0,
    status: b.status || 'active',
    cashout_at: b.status === 'cashed' ? b.cashout_at || 0 : 0,
  }));
  return [
    ...rows.filter((r) => r.status === 'active'),
    ...rows.filter((r) => r.status === 'cashed').sort((a, b) => b.cashout_at - a.cashout_at),
    ...rows.filter((r) => r.status !== 'active' && r.status !== 'cashed'),
  ];
}

function Row({ row, me }) {
  const mine = row.user_id === me;
  const value = row.status === 'active'
    ? format(row.amount)
    : row.status === 'cashed'
      ? formatMult(row.cashout_at)
      : format(row.amount);
  const tone = row.status === 'active' ? 'text-white' : row.status === 'cashed' ? 'text-[#4ade80]' : 'text-[#f87171]';

  return (
    <div
      className="flex shrink-0 items-center rounded-[10px]"
      style={{
        height: ROW_HEIGHT,
        background: '#0a0b28',
        border: `1px solid ${mine ? 'rgba(250,205,21,0.6)' : 'rgba(59,130,246,0.22)'}`,
      }}
    >
      <span className="relative overflow-hidden rounded-full" style={{ width: 42, height: 42, marginLeft: 8, flexShrink: 0 }}>
        {row.avatar ? (
          <Image src={row.avatar} alt={row.name} fittingType="fill" quality={60} className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-white/10 font-black text-white/70" style={{ fontSize: 18 }}>
            {row.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 pr-2 text-right">
        <span className="block truncate font-bold text-[#8fb6d8]" style={{ fontSize: 11 }}>{row.name}</span>
        <span className={`block font-black ${tone}`} style={{ fontSize: 23 }}>{value}</span>
      </span>
    </div>
  );
}

/** Sol kolon: oyuncular, avatarları ve bahis tutarları — liste kendi içinde kayar. */
export default function RocketLiveBoard({ bets, me }) {
  const rows = rowsOf(bets);

  return (
    <div className="no-scrollbar absolute overflow-y-auto overscroll-contain" style={BAND}>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {rows.map((row) => <Row key={row.key} row={row} me={me} />)}
      </div>
    </div>
  );
}