import { Building2, Crown, Handshake, Hourglass, Mic2 } from 'lucide-react';

export default function AgencyOverviewCard({ role, name, code, inviteCount = 0, memberAgency }) {
  const Icon = role === 'owner' ? Crown : role === 'assistant' ? Handshake : role === 'pending' ? Hourglass : Building2;
  const title = { owner: 'Ajans sahibi', assistant: 'Ajans asistanı', broadcaster: 'Yayıncı', pending: 'Onay bekleniyor' }[role] || 'Ajans sistemine katıl';
  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{title}</p>
          <h2 className="mt-1 break-words text-lg font-bold text-foreground">{name || 'Ajans merkezi'}</h2>
          {code && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{code}</p>}
        </div>
        {inviteCount > 0 && <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{inviteCount} davet</span>}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {role === 'owner' ? 'Kişisel kotan kendi ajansına işler. Kota kazancın ve ajans komisyonun ayrı ayrı hesabına yazılır.' : role === 'pending' ? `Başvurun yönetici onayında.${memberAgency?.name ? ` Onaylanana kadar kotan ${memberAgency.name} ajansına işler.` : ''}` : role === 'assistant' ? 'Davetlerini, yayıncılarını ve asistanlık kazancını buradan yönet.' : role === 'broadcaster' ? 'Kota ilerlemeni, ajans bilgilerini ve davetlerini buradan takip et.' : 'Kendi ajansını kur ya da gelen davetleri değerlendir.'}
      </p>
    </div>
  );
}