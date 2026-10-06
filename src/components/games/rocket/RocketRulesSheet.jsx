import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RULES = [
  'Yeni tur için merkezdeki gösterge geri sayar.',
  'Geri sayım bitince roket havalanır ve çarpan yükselir.',
  'Uçuş sırasında çekmezsen, çarpan çakılınca bahsi kaybedersin.',
  'Otomatik hedef, çarpan o değere ulaşınca kazancı kendiliğinden çeker.',
  'İki panel birbirinden bağımsız çalışır.',
];

/** Sağ üstteki yardım simgesinin açtığı kısa kural kartı. */
export default function RocketRulesSheet({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm border-[#2a5aa8]/60 bg-[#0a1330] text-white">
        <DialogHeader>
          <DialogTitle className="text-[#7fe4ff]">Nasıl oynanır?</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-white/85">
          {RULES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#facd15]">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}