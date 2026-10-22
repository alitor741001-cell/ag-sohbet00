import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import VipCosmeticPreview from '@/components/vip/VipCosmeticPreview';
import { vipVars } from '@/components/vip/vipTheme';
export default function VipPreviewDialog({ preview, onClose, avatar, name }) {
  return <Dialog open={!!preview} onOpenChange={(open) => { if (!open) onClose(); }}>
    {preview && <DialogContent className="vip-world z-[450] max-w-sm" style={vipVars(preview.theme)}>
      <DialogTitle>VIP {preview.theme.level} · {preview.label}</DialogTitle>
      <DialogDescription>{preview.theme.name} koleksiyonu, ön izleme</DialogDescription>
      <VipCosmeticPreview kind={preview.kind} theme={preview.theme} avatar={avatar} name={name} />
      <p className="text-center text-xs text-muted-foreground">Ön izleme diğer kozmetik seçimlerini değiştirmez.</p>
    </DialogContent>}
  </Dialog>;
}