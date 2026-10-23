import { Check, Lock, Wrench } from 'lucide-react';
export default function VipPrivilegeList({ level, features }) {
  return <section className="px-5 py-6">
    <h2 className="vip-gold mb-4 text-center text-lg font-extrabold">Özel Ayrıcalıklar</h2>
    <div className="grid grid-cols-3 gap-x-2 gap-y-4">
      {features.map((feature) => {
        const available = feature.supported && level >= feature.minLevel;
        const Icon = !feature.supported ? Wrench : available ? Check : Lock;
        return <div key={feature.key} className="flex flex-col items-center gap-1 text-center">
          <span className="vip-tile vip-tint flex h-11 w-11 items-center justify-center rounded-full"><Icon className="h-5 w-5" /></span>
          <p className="text-[10px] font-semibold">{feature.label}</p>
          <p className="text-[8px] text-muted-foreground">{!feature.supported ? 'Altyapı henüz bağlı değil' : `VIP ${feature.minLevel} ve üzeri`}</p>
        </div>;
      })}
    </div>
    <p className="mt-5 text-center text-[10px] text-muted-foreground">Çerçeveler üyeye özel rastgele seçilir; VIP 9–12 üyelerine ejderhalı çerçeveler atanır. Alt seviyelerin kozmetikleri kullanılabilir. VIP, moderasyon kurallarından muafiyet sağlamaz. Ziyaretçiler ve VIP gizlilik tercihleri Profil → Eklentiler bölümünden yönetilir; ayrıcalıklar yalnızca geçerli VIP üyeliği boyunca kullanılabilir.</p>
  </section>;
}