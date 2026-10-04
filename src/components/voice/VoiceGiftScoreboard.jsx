import VoiceSeatScore from '@/components/voice/VoiceSeatScore';

export default function VoiceGiftScoreboard({ participants = [], seats = [], scores = {} }) {
  const people = participants.filter((person) => !seats.some((seat) => seat.user_id === person.user_id));
  if (!people.length) return null;
  return <section aria-label="Hediye sayı tahtası" className="mt-4 rounded-xl border border-slot-border bg-slot-surface p-3">
    <p className="mb-2 text-center text-xs font-bold text-slot-text">Hediye sayı tahtası</p>
    <div className="flex flex-wrap justify-center gap-2">
      {people.map((person) => <div key={person.user_id} className="flex max-w-full flex-col items-center rounded-lg bg-slot-panel px-3 py-2">
        <span className="max-w-[9rem] truncate text-[11px] text-slot-text">{person.name || 'Kullanıcı'}</span>
        <VoiceSeatScore value={scores[person.user_id] || 0} />
      </div>)}
    </div>
  </section>;
}