import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import BlueAuthLayout from '@/components/auth/BlueAuthLayout';
import BlueLoginForm from '@/components/auth/BlueLoginForm';
import { safeReturnTo } from '@/lib/authReturnTo';
import { consumeBanNotice } from '@/lib/banNotice';
import { detectConnectionType } from '@/lib/connectionType';
import authErrorMessage from '@/components/auth/authErrorMessage';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const returnTo = safeReturnTo();
  const notice = consumeBanNotice();
  const noticeType = notice?.type || notice;
  const noticeReason = notice?.reason || '';
  const noticeDesc = notice?.description || '';
  const bannedParam = new URLSearchParams(window.location.search).get('banned');
  const [banned] = useState(bannedParam === '1' || noticeType === 'banned');
  const removedParam = new URLSearchParams(window.location.search).get('removed');
  const [removed] = useState(removedParam === '1' || noticeType === 'removed');
  const kickedParam = new URLSearchParams(window.location.search).get('kicked');
  const [kicked] = useState(kickedParam === '1' || noticeType === 'kicked');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let loginEmail = email;
      if (!email.includes('@')) {
        try {
          const res = await base44.functions.invoke('lookup-username', { username: email });
          loginEmail = res.data?.email || res.email;
          if (!loginEmail) throw new Error('Kullanıcı bulunamadı');
        } catch {
          setError('Kullanıcı bulunamadı');
          setLoading(false);
          return;
        }
      }
      await base44.auth.loginViaEmailPassword(loginEmail, password);
      const me = await base44.auth.me();
      if (me.is_banned || me.role === 'banned') {
        const reason = me.ban_reason || '';
        const desc = me.ban_description || '';
        await base44.auth.logout();
        setError(reason
          ? `Hesabınız banlanmıştır. Neden: ${reason}${desc ? ` — ${desc}` : ''}`
          : "Hesabınız banlanmıştır. Giriş yapamazsınız.");
        return;
      }
      const privileged = me.role === 'admin' || me.role === 'moderator';
      const membershipActive = me.membership_status === 'active' && (!me.membership_end || new Date(me.membership_end) > new Date());
      try { const res = await base44.functions.invoke('register-session', { device_session: localStorage.getItem('filmkeyfi_session_' + me.id) || '', connection_type: detectConnectionType() }); if (res?.data?.session_id) localStorage.setItem('filmkeyfi_session_' + me.id, res.data.session_id); } catch {}
      // Abonelik/paket kapısı kaldırıldı: giriş yapan kullanıcı doğrudan hedefine gider.
      window.location.href = returnTo;
    } catch (err) {
      setError(authErrorMessage(err, 'Geçersiz e-posta veya şifre'));
    } finally {
      setLoading(false);
    }
  };

  const handleProvider = async (provider) => {
    setError(''); setSocialLoading(provider);
    try { await base44.auth.loginWithProvider(provider, returnTo); }
    catch (err) { setError(authErrorMessage(err, 'Sosyal giriş başlatılamadı')); setSocialLoading(''); }
  };

  return (
    <BlueAuthLayout error={banned ? `Hesabınız banlandı. Giriş yapamazsınız.${noticeReason ? ` Neden: ${noticeReason}` : ''}${noticeDesc ? ` Açıklama: ${noticeDesc}` : ''}` : removed ? 'Hesabınız yönetici tarafından silinmiştir. Giriş yapamazsınız.' : kicked ? 'Hesabınız başka cihazdan açıldığı için bu oturum kapatıldı.' : error}>
      <BlueLoginForm email={email} setEmail={v => { setEmail(v); setError(''); }} password={password} setPassword={v => { setPassword(v); setError(''); }} shown={showPassword} toggle={() => setShowPassword(v => !v)} loading={loading} onSubmit={handleSubmit} returnTo={returnTo} />
    </BlueAuthLayout>
  );
}