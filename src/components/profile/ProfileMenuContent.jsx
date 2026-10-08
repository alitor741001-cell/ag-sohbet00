import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Headphones, LogOut, Shield, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Image } from '@/components/ui/image';
import ProfileWalletCards from '@/components/profile/ProfileWalletCards';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import useGiftSummaryLive from '@/hooks/useGiftSummaryLive';
import { giftBoxLocked } from '@/lib/giftAccess';
import { useToast } from '@/components/ui/use-toast';

/**
 * Profil menüsünün içeriği: coins, elmaslar (hediye kutusu), mavi çanta ve
 * ajans işlemleri kartları ile destek, yönetim, profil ve çıkış satırları.
 * Hem üstteki profil menüsünde hem alt menüdeki profil butonunda kullanılır.
 */
export default function ProfileMenuContent({ onClose, onOpenPanel }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vipCount, setVipCount] = useState(0);
  const [wallet, setWallet] = useState(null);

  // Mavi çantada bekleyen VIP sayısı (elmasın altındaki kart).
  const loadVipCount = () => {
    base44.functions.invoke('vip-bag', { action: 'list' })
      .then((response) => setVipCount((response.data?.items || []).length))
      .catch(() => {});
  };

  const loadWallet = useCallback(() => {
    base44.functions.invoke('gift-box', { action: 'summary' })
      .then((response) => setWallet(response.data))
      .catch(() => {});
  }, []);

  // Menü açıldığında coin ve elmas (hediye kutusu) değerleri tazelenir.
  useEffect(() => {
    loadWallet();
    loadVipCount();
  }, [loadWallet]);

  // Cüzdan değiştiğinde coin bakiyesi menüde anında güncellenir.
  useWalletCoinsLive(user?.id, (coins) => setWallet(prev => ({ ...prev, coins })));
  useGiftSummaryLive(user?.id, loadWallet);

  if (!user) return null;

  const displayName = user?.username || user?.full_name || 'Profilim';
  const elmasLocked = giftBoxLocked(user);

  return (
    <>
      {/* Header */}
      <div className="relative flex flex-col items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="w-16 h-16 rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(231,76,60,0.6))' }}>
          {user?.avatar ? (
            <Image src={user.avatar} className="w-full h-full rounded-full" fittingType="fill" />
          ) : (
            <span className="w-full h-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {displayName[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white truncate">{displayName}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
          {user?.role === 'admin' && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(74,20,140,0.5)', color: '#d8b4fe' }}>
              <Shield className="w-3 h-3" /> Yönetici
            </span>
          )}
        </div>
      </div>

      {/* Cüzdan: coins, elmaslar, mavi çanta ve ajans işlemleri */}
      <ProfileWalletCards
        coins={wallet?.coins ?? null}
        giftScore={wallet?.month_score ?? null}
        vipCount={vipCount}
        locked={elmasLocked}
        onOpenGiftBox={() => (elmasLocked
          ? toast({ title: 'Elmas ve bakiye bölümü yayıncılara açıktır', description: 'Yayıncı olduğunuzda bölüm açılır.', variant: 'destructive' })
          : onOpenPanel?.('gift'))}
        onOpenCoins={() => onOpenPanel?.('coins')}
        onOpenVipBag={() => onOpenPanel?.('vip')}
        onOpenAgency={user?.role === 'admin' ? undefined : () => { onClose(); navigate('/ajans'); }}
      />

      {/* Menu items */}
      <div className="py-1">
        {user?.role !== 'admin' && (
          <Link to="/destek" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
            <Headphones className="w-5 h-5 text-white/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Destek Talebi</p>
              <p className="text-xs text-white/50">Sorunlarınız için destek alın</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </Link>
        )}

        <div className="my-0.5 border-t border-white/10" />

        {user?.role === 'admin' && (
          <Link to="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
            <Shield className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Yönetim Paneli</p>
              <p className="text-xs text-white/50">Admin kontrol paneli</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </Link>
        )}

        <Link to="/profil" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors relative">
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-purple-500" />
          <User className="w-5 h-5 text-white/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Profilim</p>
            <p className="text-xs text-white/50">Hesap bilgilerinizi düzenleyin</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </Link>

        <div className="my-0.5 border-t border-white/10" />

        <button onClick={() => { onClose(); base44.auth.logout('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-red-400">Çıkış Yap</p>
            <p className="text-xs text-white/50">Hesabınızdan güvenli çıkış yapın</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </button>
      </div>

    </>
  );
}