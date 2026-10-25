export default function authErrorMessage(error, fallback = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.') {
  const raw = error?.response?.data?.detail || error?.data?.detail || error?.message || '';
  const message = typeof raw === 'string' ? raw : '';
  const text = message.toLowerCase();
  if (/password/.test(text) && /breach|exposed|compromised|leaked|pwned|common|weak|easy/.test(text)) return 'Bu şifre yeterince güvenli değil veya daha önce bir veri sızıntısında kullanılmış. Farklı ve benzersiz bir şifre oluşturun.';
  if (/password/.test(text) && /short|length|least|characters/.test(text)) return `Şifreniz en az ${text.match(/(?:least|minimum|length of)\s+(\d+)/)?.[1] || 8} karakter olmalıdır.`;
  if (/already|exists|registered|in use/.test(text)) return 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.';
  if (/verify.*email|email.*verif/.test(text)) return 'Giriş yapmadan önce e-posta adresinize gönderilen kodla hesabınızı doğrulayın.';
  if (/expired/.test(text)) return 'Doğrulama kodunun veya bağlantının süresi dolmuş. Yenisini isteyin.';
  if (/otp|verification code|invalid code/.test(text)) return 'Doğrulama kodu geçersiz. E-postanıza gelen 6 haneli kodu kontrol edin.';
  if (/too many|rate limit|429/.test(text)) return 'Çok fazla deneme yaptınız. Biraz bekleyip tekrar deneyin.';
  if (/invalid email|email.*valid|valid.*email/.test(text)) return 'Geçerli bir e-posta adresi girin. Örnek: isim@gmail.com';
  if (/invalid.*(credentials|password)|incorrect|unauthorized/.test(text)) return 'E-posta adresiniz veya şifreniz hatalı.';
  if (/network|fetch|connection/.test(text)) return 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message)) return message;
  return fallback;
}