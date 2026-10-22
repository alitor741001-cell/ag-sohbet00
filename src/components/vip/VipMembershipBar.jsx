export default function VipMembershipBar({ level, expiresAt, onOpen }) {
  const hasExpiry = Number.isFinite(Date.parse(expiresAt || ''));
  return <footer className="vip-glass fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg">
    <div className="mx-auto flex max-w-lg items-center gap-3">
      <div className="min-w-0 flex-1 text-[11px]">
        <p className="font-bold">{level >= 5 ? `VIP ${level} üyeliğin aktif` : 'VIP 5–12 üyelikleri'}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{level >= 5 ? hasExpiry ? `Bitiş: ${new Date(expiresAt).toLocaleDateString('tr-TR')}` : 'Süresiz üyelik' : 'Çantandaki üyeliği etkinleştir'}</p>
        <p className="mt-0.5 text-[8px] text-muted-foreground">Jeton yüklemesiyle kazanılır; burada ödeme alınmaz.</p>
      </div>
      <button type="button" onClick={onOpen} className="vip-button rounded-xl px-6 py-3 text-sm font-black">{level >= 5 ? 'VIP Yenile' : 'VIP Ol'}</button>
    </div>
  </footer>;
}