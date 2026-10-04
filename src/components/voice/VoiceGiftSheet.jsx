import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import { GIFTS } from '@/lib/gifts';

const Chip = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 ${active ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}
  >
    {label}
  </button>
);

/** Hediye paneli: coin bakiyesi, alıcı seçimi ve 4x2 hediye ızgarası. */
export default function VoiceGiftSheet({ open, onClose, onSend, people = [], coins }) {
  const [targetId, setTargetId] = useState('');

  useEffect(() => { if (open) setTargetId(''); }, [open]);

  const targetName = people.find((person) => person.user_id === targetId)?.name;

  return (
    <VoiceSheet open={open} onClose={onClose} title="Hediye gönder">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2">
        <span className="text-xs text-white/60">Slot coin bakiyen</span>
        <span className="flex items-center gap-1 text-sm font-black tabular-nums text-amber-300">
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : Number(coins).toLocaleString('tr-TR')}
        </span>
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">Kime gönderilsin?</p>
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!targetId} label="Odaya" onClick={() => setTargetId('')} />
        {people.map((person) => (
          <Chip key={person.user_id} active={targetId === person.user_id} label={person.name || 'Kullanıcı'} onClick={() => setTargetId(person.user_id)} />
        ))}
      </div>

      <p className="mb-3 text-center text-xs text-white/60">
        {targetName ? `Seçilen hediye ${targetName} kişisine gider.` : 'Seçilen hediye odadaki herkesin ekranında belirir.'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {GIFTS.map((gift) => (
          <button
            key={gift.id}
            type="button"
            onClick={() => onSend(gift.id, targetId || null)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-gradient-to-b from-white/12 to-white/5 px-1.5 py-2.5 transition-transform active:scale-95"
          >
            <span className="text-[30px] leading-none">{gift.emoji}</span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-white/85">{gift.name}</span>
            <span className="flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              <Coins className="h-3 w-3" /> {gift.coins}
            </span>
          </button>
        ))}
      </div>
    </VoiceSheet>
  );
}