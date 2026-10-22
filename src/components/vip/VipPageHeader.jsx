import { ArrowLeft, CircleHelp, BriefcaseBusiness } from 'lucide-react';
export default function VipPageHeader({ onBack, onBag, onHelp }) {
  return <header className="vip-glass flex items-center justify-between border-x-0 px-3 pb-2 pt-[max(.75rem,env(safe-area-inset-top))]">
    <button type="button" onClick={onBack} aria-label="Geri" className="rounded-full p-2"><ArrowLeft className="h-5 w-5" /></button>
    <h1 className="font-display text-lg font-extrabold tracking-[.25em]">VIP</h1>
    <div className="flex"><button type="button" onClick={onBag} aria-label="VIP çantam" className="p-2"><BriefcaseBusiness className="h-5 w-5" /></button><button type="button" onClick={onHelp} aria-label="VIP yardımı" className="p-2"><CircleHelp className="h-5 w-5" /></button></div>
  </header>;
}