const LOGO = 'https://agsohbet.com/icon-ag-512.png';
const SITE = 'https://agsohbet.com';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

// Doğrulama ve şifre sıfırlama e-postalarıyla aynı AG lacivert-mavi tasarım.
function agEmail({ name, title, message, button, href }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#02030c;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#02030c;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#030618;border:2px solid #1d4ed8;border-radius:24px;">
<tr><td align="center" style="padding:36px 24px 8px;"><img src="${LOGO}" width="140" height="140" alt="AG SOHBET" style="display:block;width:140px;height:140px;border:0;border-radius:28px;"></td></tr>
<tr><td align="center" style="padding:8px 24px 0;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:2px;">AG SOHBET</td></tr>
<tr><td align="center" style="padding:20px 28px 6px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:22px;font-weight:700;">${title}</td></tr>
<tr><td align="center" style="padding:0 28px 24px;font-family:Arial,Helvetica,sans-serif;color:#bfdbfe;font-size:15px;line-height:1.6;">Merhaba <strong style="color:#ffffff;">${escapeHtml(name)}</strong>,<br>${message}</td></tr>
<tr><td align="center" style="padding:0 24px;"><a href="${href}" style="display:inline-block;padding:14px 48px;background-color:#1d4ed8;border:2px solid #60a5fa;border-radius:40px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;">${button}</a></td></tr>
<tr><td align="center" style="padding:24px 28px 32px;font-family:Arial,Helvetica,sans-serif;color:#93c5fd;font-size:13px;">Bu e-posta AG SOHBET tarafından gönderilmiştir.<br><a href="${SITE}" style="color:#93c5fd;text-decoration:none;">agsohbet.com</a></td></tr>
</table>
</td></tr></table></body></html>`;
}

export function accountDeletedEmail({ name }) {
  return agEmail({
    name,
    title: 'Hesabınız Silinmiştir',
    message: 'AG SOHBET hesabınız ve tüm kişisel verileriniz kalıcı olarak silinmiştir. Bizi tercih ettiğiniz için teşekkür ederiz, sizi tekrar aramızda görmek dileğiyle!',
    button: 'Bizi Tekrar Ziyaret Edin',
    href: SITE,
  });
}

export function membershipEmail({ name, status }) {
  const active = status === 'active';
  return agEmail({
    name,
    title: active ? 'Üyeliğiniz Aktif Edilmiştir' : 'Üyeliğiniz Bitmiştir',
    message: active
      ? "Hesabınız aktif edildi. AG SOHBET'in tüm odalarına ve özelliklerine artık erişebilirsiniz. İyi eğlenceler!"
      : 'Üyeliğinizin süresi dolmuştur. Tüm verileriniz korunur; üyeliğinizi yeniden aktif ederek kaldığınız yerden devam edebilirsiniz.',
    button: active ? 'Hemen Başla' : 'Üyeliği Aktif Et',
    href: SITE,
  });
}