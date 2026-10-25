import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import BlueAuthLayout from '@/components/auth/BlueAuthLayout';
import BlueRegisterForm from '@/components/auth/BlueRegisterForm';
import BlueOtpForm from '@/components/auth/BlueOtpForm';
import { toast } from '@/components/ui/use-toast';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function Register() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setAvatar(file_url); }
    catch { setError("Profil fotoğrafı yüklenemedi"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!acceptTerms) { setError("Kullanım koşullarını kabul etmelisiniz"); return; }
    if (password !== confirmPassword) { setError("Şifreler eşleşmiyor"); return; }
    if (password.length < 6) { setError("Şifre en az 6 karakter olmalı"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(Date.parse(birthDate))) { setError("Doğum tarihinizi seçin"); return; }
    if (birthDate > new Date().toISOString().slice(0, 10)) { setError("Doğum tarihi gelecekte olamaz"); return; }
    if (!gender) { setError("Cinsiyet seçimi yapın"); return; }
    // Yeni kayıt izni kontrolü
    try {
      const ps = await base44.functions.invoke('public-settings', {});
      const settings = ps.data || ps;
      if (settings.registration_open === false) {
        setError("Yeni kayıtlar şu anda kapalı. Lütfen daha sonra tekrar deneyin.");
        return;
      }
    } catch { /* devam et */ }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim().toLowerCase(), password });
      // Doğrulama ekranına geç — OTP doğrulanmadan giriş yapılmaz
      setShowOtp(true);
      toast({ title: "Kod gönderildi", description: `${email} adresine doğrulama kodu gönderildi.` });
    } catch (err) {
      setError(err.message || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim().toLowerCase(), otpCode });
      if (!result?.access_token) throw new Error("Doğrulama kodu geçersiz");
      base44.auth.setToken(result.access_token);
      try {
        await base44.auth.updateMe({
          full_name: fullName, username, avatar,
          birth_date: birthDate, gender,
          // Paket/ödeme adımı yok: kayıt tamamlanınca hesap doğrudan aktif olur.
          membership_status: "active",
        });
      } catch {}
      await base44.functions.invoke('ensure-member-id').catch(() => {});
      // Admin'e yeni kullanıcı bildirimi gönder (real-time + web push)
      base44.functions.invoke('admin-notify', {
        event: 'new_user',
        ref_id: `new_user:${email}`,
        title: 'Yeni kullanıcı kaydoldu',
        body: fullName || username || email,
        link: '/admin/kullanicilar',
        telegram_data: { username: fullName || username || email, email, date: new Date().toLocaleString('tr-TR') }
      }).catch(() => {});
      toast({ title: "Kayıt tamamlandı", description: "Tüm içeriklere erişebilirsin, ana sayfaya yönlendiriliyorsun." });
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Geçersiz doğrulama kodu");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setError("");
    setResending(true);
    try {
      await base44.auth.resendOtp(email.trim().toLowerCase());
      setOtpCode("");
      setResendCooldown(60);
      toast({ title: "Yeni kod gönderildi", description: `${email} adresine yeni doğrulama kodu gönderildi.` });
    } catch (err) {
      setError(err.message || "Kod gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setResending(false);
    }
  };

  const handleProvider = async (provider) => {
    if (!acceptTerms) { setError('Kullanım koşullarını kabul etmelisiniz'); return; }
    setError(''); setSocialLoading(provider);
    try { await base44.auth.loginWithProvider(provider, safeReturnTo()); }
    catch (err) { setError(err.message || 'Sosyal kayıt başlatılamadı'); setSocialLoading(''); }
  };

  if (showOtp) {
    return <BlueAuthLayout mode="register" title="E-postanı doğrula" subtitle={`${email} adresine bir kod gönderdik`}>
      <BlueOtpForm error={error} code={otpCode} setCode={value => { setOtpCode(value); setError(''); }} loading={loading} onVerify={handleVerify} resending={resending} cooldown={resendCooldown} onResend={handleResend} />
    </BlueAuthLayout>;
  }

  return <BlueAuthLayout mode="register" title="Kayıt Ol" subtitle="Hesabını oluştur ve film keyfine katıl!">
    {error && <p className="blue-auth-error" role="alert">{error}</p>}
    <BlueRegisterForm
      values={{ email, password, confirmPassword, fullName, username, birthDate, gender, avatar, acceptTerms }}
      setters={{ email: setEmail, password: setPassword, confirmPassword: setConfirmPassword, fullName: setFullName, username: setUsername, birthDate: setBirthDate, gender: setGender, acceptTerms: setAcceptTerms }}
      shown={showPassword} toggle={() => setShowPassword(v => !v)} showConfirm={showConfirm} toggleConfirm={() => setShowConfirm(v => !v)}
      onSubmit={handleSubmit} onAvatar={onAvatar} loading={loading} socialLoading={socialLoading} onProvider={handleProvider} returnTo={safeReturnTo()}
    />
  </BlueAuthLayout>;
}