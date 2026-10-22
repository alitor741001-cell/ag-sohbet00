import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Camera, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthBackground from "@/components/auth/AuthBackground";
import { toast } from "@/components/ui/use-toast";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import LegalLinks from "@/components/auth/LegalLinks";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const navigate = useNavigate();
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
    if (!birthDate) { setError("Doğum tarihinizi seçin"); return; }
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

  // Doğum tarihi seçicisi bugünden ileriye izin vermez.
  const today = new Date().toISOString().slice(0, 10);
  const genderOptions = [
    { key: 'kadın', label: 'Kadın' },
    { key: 'erkek', label: 'Erkek' },
  ];

  if (showOtp) {
    return (
      <AuthBackground>
        <div className="bg-[#141414]/95 backdrop-blur-sm rounded-2xl border border-[#2a2a2a] p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">E-postanı doğrula</h2>
          <p className="text-sm text-[#a0a0a0] mb-6">{email} adresine bir kod gönderdik</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={(value) => { setOtpCode(value); if (error) setError(""); }} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full h-12 font-semibold bg-[#e50914] hover:bg-[#f6121d] text-white" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor...</> : "Doğrula"}
          </Button>
          <p className="text-center text-sm text-[#a0a0a0] mt-4">Kod gelmedi mi? <button type="button" onClick={handleResend} disabled={resending || resendCooldown > 0} className="text-[#e50914] font-medium hover:underline disabled:text-[#666] disabled:no-underline">{resending ? "Gönderiliyor..." : resendCooldown > 0 ? `Tekrar gönder (${resendCooldown})` : "Tekrar gönder"}</button></p>
        </div>
      </AuthBackground>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#0a0a0a] overflow-hidden">
      {/* Arka plan */}
      <div className="absolute inset-0 grid grid-cols-6 gap-1 opacity-15 pointer-events-none select-none">
        {[...Array(24)].map((_, i) => (
          <div key={i} style={{ backgroundImage: `linear-gradient(135deg, hsl(${(i * 23) % 360} 30% 15%), hsl(${(i * 17) % 360} 40% 8%))` }} />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/90 to-[#0a0a0a]/95 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Geri butonu */}
        <button onClick={() => navigate("/login")} className="inline-flex items-center gap-1.5 text-sm text-[#a0a0a0] hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </button>

        {/* İçerik */}
        <div className="max-w-md mx-auto">
          <div className="bg-[#141414]/95 backdrop-blur-sm rounded-2xl border border-[#2a2a2a] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Hesap Oluştur</h2>
            <p className="text-sm text-[#a0a0a0] mb-6">Lütfen bilgilerinizi eksiksiz doldurun. Kayıt sonrası tüm içeriklere erişebilirsin.</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profil foto */}
              <div className="flex flex-col items-center mb-2">
                <label className="cursor-pointer">
                  <div className={`w-20 h-20 rounded-full border-2 border-dashed border-[#3a3a3a] flex items-center justify-center overflow-hidden bg-[#0a0a0a] hover:border-[#e50914] transition-colors`}>
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (
                      <div className="flex flex-col items-center gap-1 text-[#a0a0a0]">
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px]">Profil Fotoğrafı Ekle</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-[#a0a0a0]">Ad Soyad</Label>
                <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#e50914]" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#a0a0a0]">Kullanıcı adı</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullanici" className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#e50914]" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-[#a0a0a0]">Doğum tarihi</Label>
                <Input id="birthdate" type="date" value={birthDate} max={today} onChange={(e) => { setBirthDate(e.target.value); if (error) setError(""); }} className="h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white [color-scheme:dark] focus:border-[#e50914]" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a0a0]">Cinsiyet</Label>
                <div className="grid grid-cols-2 gap-3">
                  {genderOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => { setGender(option.key); if (error) setError(""); }}
                      className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${gender === option.key ? 'border-[#e50914] bg-[#e50914] text-white' : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[#e50914] hover:text-white'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#a0a0a0]">E-posta adresiniz</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                  <Input id="email" type="email" autoComplete="email" placeholder="ornek@mail.com" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} className="pl-10 h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#e50914]" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#a0a0a0]">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }} className="pl-10 pr-10 h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#e50914]" required />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-white">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[#a0a0a0]">Şifre tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                  <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }} className="pl-10 pr-10 h-11 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#e50914]" required />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-white">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[#e50914] bg-[#0a0a0a] border-[#2a2a2a]" />
                <span className="text-xs text-[#a0a0a0]">Yasal koşulları okudum ve kabul ediyorum.</span>
              </label>
              <LegalLinks className="w-full text-[11px] text-[#e50914]" />
              <div className="relative py-2"><div className="border-t border-[#2a2a2a]" /><span className="absolute left-1/2 top-0 -translate-x-1/2 bg-[#141414] px-3 text-xs text-[#777]">veya</span></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => handleProvider('google')} disabled={!!socialLoading} className="h-11 bg-white text-black border-white hover:bg-[#eee] hover:text-black">{socialLoading === 'google' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GoogleIcon className="w-5 h-5 mr-2" />} Google ile Üye Ol</Button>
                <Button type="button" variant="outline" onClick={() => handleProvider('apple')} disabled={!!socialLoading} className="h-11 bg-black text-white border-[#444] hover:bg-[#111] hover:text-white">{socialLoading === 'apple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AppleIcon className="w-5 h-5 mr-2" />} Apple ile Üye Ol</Button>
              </div>
              <Button type="submit" className="w-full h-12 font-semibold bg-[#e50914] hover:bg-[#f6121d] text-white" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Hesap oluşturuluyor...</> : "Devam Et"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}