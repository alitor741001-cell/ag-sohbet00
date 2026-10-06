import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PRESETS = [1.5, 2, 3, 5, 7, 10, 25, 50, 100, 250, 500];

/** Otomatik çekilme hedefi: hazır kademeler veya elle yazılan çarpan (örn. 7x). */
export default function RocketAutoDialog({ open, value, onSave, onClose }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText(value > 0 ? String(value) : '');
  }, [open, value]);

  const submit = () => {
    const parsed = Number(text.replace(',', '.'));
    onSave(Number.isFinite(parsed) ? parsed : 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[20rem] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Otomatik çekilme</DialogTitle>
          <DialogDescription className="text-xs">
            Çarpan bu değere ulaştığında bahsin kendiliğinden çekilir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setText(String(preset))}
            >
              {preset}x
            </Button>
          ))}
        </div>

        <Input
          value={text}
          inputMode="decimal"
          placeholder="örn. 7"
          onChange={(event) => setText(event.target.value.replace(/[^0-9.,]/g, ''))}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onSave(0);
              onClose();
            }}
          >
            Kapat
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={submit}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}