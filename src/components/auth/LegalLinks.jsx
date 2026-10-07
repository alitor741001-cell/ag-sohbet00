import { useState } from 'react';
import { X } from 'lucide-react';

// Yasal metinler şimdilik boş bırakıldı: içerikler sonra doldurulacak.
const documents = {
  terms: { title: 'Kullanım Koşulları', sections: [] },
  privacy: { title: 'Gizlilik Politikası', sections: [] },
  cookies: { title: 'Çerez Politikası', sections: [] },
  contact: { title: 'İletişim', sections: [] },
};

export default function LegalLinks({ className = '' }) {
  const [active, setActive] = useState(null); const doc = active && documents[active];
  return <><span className={`inline-flex flex-wrap justify-center gap-x-2 gap-y-1 ${className}`}>
    <button type="button" onClick={() => setActive('terms')} className="hover:underline">Kullanım Koşulları</button>
    <button type="button" onClick={() => setActive('privacy')} className="hover:underline">Gizlilik Politikası</button>
    <button type="button" onClick={() => setActive('cookies')} className="hover:underline">Çerez Politikası</button>
    <button type="button" onClick={() => setActive('contact')} className="hover:underline">İletişim</button>
  </span>
  {doc && <div className="fixed inset-0 z-[200] bg-black/75 flex items-center justify-center p-4" onClick={() => setActive(null)}>
    <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#141414] border border-[#333] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-5 flex items-center justify-between"><h2 className="text-xl font-bold">{doc.title}</h2><button type="button" onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Kapat"><X className="w-5 h-5" /></button></div>
      <div className="p-5 space-y-5">{doc.sections.map(([title,text]) => <section key={title}><h3 className="font-semibold mb-1">{title}</h3><p className="text-sm leading-6 text-[#b8b8b8] whitespace-pre-line">{text}</p></section>)}{doc.sections.length > 0 && <p className="text-xs text-[#777] pt-2 border-t border-[#2a2a2a]">Son güncelleme: 2 Eylül 2026</p>}</div>
    </div>
  </div>}</>;
}