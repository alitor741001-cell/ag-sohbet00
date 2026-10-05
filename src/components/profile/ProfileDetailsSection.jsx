import { CalendarDays, Mail, Phone, ShieldCheck, User, Users } from 'lucide-react';
import { ageFromBirthDate, formatDate } from '@/components/profile/genderPalette';
import { visibleEmail } from '@/lib/visibleEmail';

const genderLabel = (gender) => {
  if (gender === 'erkek') return 'Erkek';
  if (gender === 'kadın' || gender === 'kadin') return 'Kadın';
  return 'Belirtilmedi';
};

/** Kişisel Bilgiler: kullanıcı adı, kimlik no ve hesap bilgileri. Düzenlemede ad/telefon/doğum tarihi güncellenir. */
export default function ProfileDetailsSection({ user, editing, form, setForm, onSave, onEdit, onCancel, saving }) {
  if (editing) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-3.5">
        <Field label="Kullanıcı Adı" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <Field label="Ad Soyad (hesap bilgisi)" value={form.full_name} disabled />
        <p className="-mt-2 text-[11px] text-white/50">Ad soyad hesap tarafından yönetilir; görünen adınızı Kullanıcı Adı alanından değiştirebilirsiniz.</p>
        <Field label="Telefon" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <Field label="Doğum Tarihi" type="date" value={form.birth_date || ''} onChange={(birth_date) => setForm({ ...form, birth_date })} />
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          <button onClick={onCancel} disabled={saving} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">İptal</button>
        </div>
      </div>
    );
  }

  const age = ageFromBirthDate(user.birth_date);
  const rows = [
    [User, 'Kullanıcı Adı', user.username || '—'],
    [Users, 'Ad Soyad', user.full_name || '—'],
    [ShieldCheck, 'Kimlik No', user.member_id || '—'],
    ...(visibleEmail(user) ? [[Mail, 'E-posta', visibleEmail(user)]] : []),
    [Phone, 'Telefon', user.phone || 'Eklenmedi'],
    [Users, 'Cinsiyet', genderLabel(user.gender)],
    [CalendarDays, 'Yaş', age === null ? '—' : String(age)],
    [CalendarDays, 'Doğum Tarihi', user.birth_date ? formatDate(user.birth_date) : 'Eklenmedi'],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]">
      {rows.map(([Icon, label, value]) => (
        <div key={label} className="flex items-center gap-3 border-b border-white/10 px-3.5 py-2.5 last:border-0">
          <Icon className="h-4 w-4 shrink-0 text-white/45" />
          <span className="text-[11px] font-medium text-white/55">{label}</span>
          <span className="ml-auto max-w-[55%] truncate text-right text-sm font-semibold text-white">{value}</span>
        </div>
      ))}
      <button onClick={onEdit} className="m-3 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white active:scale-95">
        Düzenle
      </button>
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = 'text' }) {
  return (
    <label className="block text-[11px] font-medium text-white/55">
      {label}
      <input
        value={value}
        type={type}
        max={type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/60 disabled:opacity-60"
      />
    </label>
  );
}