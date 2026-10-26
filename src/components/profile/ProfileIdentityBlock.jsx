import { CalendarDays, MapPin } from 'lucide-react';

/** Cinsiyet, ülke ve kayıt tarihi aynı boyda üç küçük bilgi kutusu. */
export default function ProfileIdentityBlock({ genderLabel, age, country, flag, joinDate }) {
  const chip = 'flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-fantasy-gold/40 bg-fantasy-gold/10 px-1 text-center text-[10px] font-bold text-fantasy-text';
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className={chip}>
        <span className="text-[9px] text-fantasy-gold">Cinsiyet</span>
        <span className="max-w-full truncate">{genderLabel}{age != null ? ` · ${age}` : ''}</span>
      </div>
      <div className={chip}>
        <span className="flex items-center gap-1 text-[9px] text-fantasy-gold"><MapPin className="h-3 w-3" />Ülke</span>
        <span className="max-w-full truncate" title={country}>{flag} {country || '—'}</span>
      </div>
      <div className={chip}>
        <span className="flex items-center gap-1 text-[9px] text-fantasy-gold"><CalendarDays className="h-3 w-3" />Kayıt</span>
        <span className="max-w-full truncate tabular-nums">{joinDate}</span>
      </div>
    </div>
  );
}