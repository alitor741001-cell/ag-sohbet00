import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VipMembershipBar from '@/components/vip/VipMembershipBar';
import useVipPurchase from '@/hooks/useVipPurchase';

export default function VipPurchasePanel({ theme, level, expiresAt, onChanged }) {
  const [confirm, setConfirm] = useState(null);
  const purchase = useVipPurchase(onChanged);
  return <>
    <VipMembershipBar theme={theme} level={level} expiresAt={expiresAt} onBuy={() => setConfirm(theme)} busy={purchase.busy} error={purchase.error} notice={purchase.notice} />
    <ConfirmDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }} title={`VIP ${confirm?.level || theme.level} satın al`}
      description={confirm ? `${confirm.purchase_coins.toLocaleString('tr-TR')} Coins bakiyenden düşülecek ve VIP ${confirm.level} 30 gün için etkinleştirilecek. ${level > confirm.level ? `Aktif VIP ${level} seviyen VIP ${confirm.level} olarak değişir. ` : ''}Varsa kalan üyelik sürene 30 gün eklenir.` : ''}
      confirmText="Satın Al" onConfirm={() => { if (confirm && !purchase.busy) purchase.buy(confirm.level); }} />
  </>;
}