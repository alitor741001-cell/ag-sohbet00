import { useState } from 'react';
import AdminCosmeticCatalog from '@/components/admin/store/AdminCosmeticCatalog';
import '@/components/store/cabinet.css';
export default function AdminCosmeticManager() {
  const [open, setOpen] = useState(false);
  return <details className="cosmetic-cabinet mb-5 rounded-2xl border border-cabinet-gold/40 p-4" onToggle={e => setOpen(e.currentTarget.open)}><summary className="cursor-pointer py-2 text-sm font-black text-cabinet-gold">Çerçeve Mağazası ve VIP Giriş Efektleri</summary>{open && <AdminCosmeticCatalog />}</details>;
}