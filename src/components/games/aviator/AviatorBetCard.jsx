import React, { useState } from 'react';
import { ChevronsRight, Minus, Plus } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { AVIATOR_PLANE } from '../rocketAssets';
import { format, formatAuto } from '../rocket/rocketConfig';

const CHIPS = [500, 1000, 5000, 10000];

/** Bahis kartı: Bahis/Otomatik sekmesi, tutar, hızlı seçimler ve büyük BAHİS butonu. */
export default function AviatorBetCard({ color, slot, onAutoEdit }) {
  const [tab, setTab] = useState('bet');
  const green = color === 'green';
  const btn = slot.tone === 'cash' ? 'av-btn-cash' : slot.tone === 'cancel' ? 'av-btn-cancel' : green ? 'av-btn-green' : 'av-btn-red';

  return (
    <div className={`av-panel ${green ? 'av-panel-green' : 'av-panel-red'} flex min-w-0 flex-1 flex-col gap-1.5 p-1.5`}>
      <div className="flex rounded-full bg-black/60 p-0.5 text-[11px] font-bold">
        <button type="button" onClick={() => setTab('bet')} className={`flex-1 rounded-full py-1 ${tab === 'bet' ? (green ? 'av-tab-green' : 'av-tab-red') : 'text-white/60'}`}>Bahis</button>
        <button type="button" onClick={() => { setTab('auto'); onAutoEdit(); }} className={`flex-1 rounded-full py-1 ${tab === 'auto' ? (green ? 'av-tab-green' : 'av-tab-red') : 'text-white/60'}`}>Otomatik</button>
      </div>
      <div className="flex items-center rounded-full border border-white/10 bg-black/60 py-1 pl-3 pr-1">
        <span className="min-w-0 flex-1 truncate text-base font-bold tabular-nums text-white">{format(slot.amount)}</span>
        <button type="button" disabled={slot.locked} onClick={() => slot.onAmount(-1)} className="av-round"><Minus className="h-4 w-4" /></button>
        <button type="button" disabled={slot.locked} onClick={() => slot.onAmount(1)} className="av-round ml-1"><Plus className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {CHIPS.map((c) => (
          <button key={c} type="button" disabled={slot.locked} onClick={() => slot.onSet(c)} className="rounded-full border border-white/10 bg-black/60 py-1 text-[11px] font-semibold text-white/85 active:bg-white/10">{format(c)}</button>
        ))}
      </div>
      <p className="text-center text-[9px] text-white/50">Oto. çekilme: {formatAuto(slot.auto)}</p>
      <button type="button" disabled={slot.disabled} onClick={slot.onAction} className={`av-btn ${btn}`}>
        <Image src={AVIATOR_PLANE} alt="" className="h-7 w-10 shrink-0 mix-blend-screen" fittingType="fit" />
        <span className="flex min-w-0 flex-col items-center leading-tight">
          <span className="text-base font-black">{slot.label}</span>
          {slot.sub && <span className="truncate text-[10px] font-semibold opacity-90">{slot.sub}</span>}
        </span>
        <ChevronsRight className="h-5 w-5 shrink-0 opacity-80" />
      </button>
    </div>
  );
}