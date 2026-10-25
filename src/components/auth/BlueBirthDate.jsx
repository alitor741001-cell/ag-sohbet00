import { CalendarDays } from 'lucide-react';

export default function BlueBirthDate({ value, onChange }) {
  const [year = '', month = '', day = ''] = value.split('-');
  const currentYear = new Date().getFullYear();
  const days = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const update = (part, next) => {
    const parts = { year, month, day, [part]: next };
    if (parts.year && parts.month && parts.day) parts.day = String(Math.min(Number(parts.day), new Date(Number(parts.year), Number(parts.month), 0).getDate())).padStart(2, '0');
    onChange(`${parts.year}-${parts.month}-${parts.day}`);
  };
  return <fieldset className="blue-auth-birth">
    <legend><CalendarDays size={18} /> Doğum Tarihi</legend>
    <div className="grid grid-cols-3 gap-2">
      <select aria-label="Gün" required value={day} onChange={e => update('day', e.target.value)}><option value="">Gün</option>{Array.from({ length: days }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>)}</select>
      <select aria-label="Ay" required value={month} onChange={e => update('month', e.target.value)}><option value="">Ay</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>)}</select>
      <select aria-label="Yıl" required value={year} onChange={e => update('year', e.target.value)}><option value="">Yıl</option>{Array.from({ length: 121 }, (_, i) => <option key={i} value={currentYear - i}>{currentYear - i}</option>)}</select>
    </div>
  </fieldset>;
}