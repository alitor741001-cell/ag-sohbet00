import { useEffect, useState } from 'react';
import FaceLockOverlay from '@/components/face/FaceLockOverlay';
import { faceStatus } from '@/lib/faceCheck';

/**
 * Yeni cihaz kapısı: hesap bu cihazda doğrulanmadıysa uygulama kullanılamaz.
 * Kapı sayfanın üstüne tam ekran oturur; yüz doğrulaması bitene kadar hiçbir
 * işlem yapılamaz. Eklentiler bölümünden kapatılırsa kapı hiç çalışmaz.
 */
export default function FaceGate({ user }) {
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (!user?.id) { setState('idle'); return undefined; }
    // Yöneticiler muaf: panelden çıkamayacak şekilde kilitlenmezler.
    if (user.role === 'admin') { setState('idle'); return undefined; }
    let alive = true;
    setState('checking');
    faceStatus(user.id)
      .then((status) => {
        if (!alive) return;
        if (!status.enabled || status.trusted) { setState('idle'); return; }
        setState(status.enrolled ? 'verify' : 'enroll');
      })
      // Durum okunamazsa uygulama açılır: geçici hata hesabı kilitlemez.
      .catch(() => { if (alive) setState('idle'); });
    return () => { alive = false; };
  }, [user?.id, user?.role]);

  if (state === 'idle') return null;
  if (state === 'checking') return <div className="fixed inset-0 z-[300] bg-catalog" />;
  return (
    <FaceLockOverlay
      user={user}
      mode={state === 'enroll' ? 'enroll' : 'verify'}
      scope="device"
      onVerified={() => setState('idle')}
    />
  );
}