import { useMemo } from 'react';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Sayı tahtası açıkken profillerin altında açılan hediye bölümü: herkesin hediye toplamı, büyükten küçüğe. */
export default function VoiceGiftScoreboard({ participants = [], seats = [], scores = {} }) {
  const people = useMemo(() => {
    const map = new Map();
    seats.forEach((seat) => {
      if (seat.user_id) map.set(seat.user_id, { user_id: seat.user_id, name: seat.name || 'Kullanıcı' });
    });
    participants.forEach((person) => {
      if (person.user_id && !map.has(person.user_id)) {
        map.set(person.user_id, { user_id: person.user_id, name: person.name || 'Kullanıcı' });
      }
    });
    return [...map.values()]
      .map((person) => ({ ...person, score: Number(scores[person.user_id]) || 0 }))
      .filter((person) => person.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [seats, participants, scores]);

  return (
    <section aria-label="Hediye bölümü" className="mt-4 rounded-2xl border border-slot-border bg-slot-surface p-3">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slot-text/80">Hediye bölümü</p>
      {people.length === 0 ? (
        <p className="text-center text-[11px] text-slot-text/50">Henüz hediye gönderilmedi.</p>
      ) : (
        <div className="space-y-1.5">
          {people.map((person, index) => (
            <div key={person.user_id} className="flex items-center gap-2 rounded-xl bg-slot-panel px-3 py-2">
              <span className="w-5 shrink-0 text-center text-[11px] font-black tabular-nums text-slot-text/60">
                {MEDALS[index] || index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slot-text">{person.name}</span>
              <VoiceSeatScore value={person.score} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}