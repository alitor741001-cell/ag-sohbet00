function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

export function accountDeletedEmail({ name }) {
  const title = 'Hesabınız Silinmiştir';
  const message = 'FILMKEYFİ hesabınız ve tüm kişisel verileriniz GDPR uyumlu şekilde kalıcı olarak silinmiştir. Tüm izleme geçmişiniz, favorileriniz, ödeme kayıtlarınız ve profil bilgileriniz tamamen kaldırılmıştır. Bizi tercih ettiğiniz için teşekkür ederiz. Sizi tekrar aramızda görmek dileğiyle!';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#0a0a0f;table-layout:fixed;">
<tr><td align="center" valign="top" style="padding:24px 12px;">
<table role="presentation" width="500" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:500px;background-color:#17171d;border:1px solid #542126;border-radius:20px;border-collapse:separate;overflow:hidden;">
<tr><td align="center" style="padding:30px 24px 24px;background-color:#21171a;">
<img src="https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6379df5b6_351A5169-7769-4C41-8816-B20112620648.png" width="200" height="200" alt="FilmKeyfi" style="display:block;width:200px;height:200px;max-width:80%;margin:0 auto;border:0;border-radius:16px;">
</td></tr>
<tr><td align="center" style="padding:28px 28px 32px;">
<div style="font-size:44px;line-height:50px;margin-bottom:16px;">🗑️</div>
<h1 style="margin:0 0 16px;font-size:26px;line-height:34px;font-weight:800;color:#ffffff;">${title}</h1>
<p style="margin:0 0 28px;font-size:17px;line-height:27px;color:#e5e7eb;">Merhaba <strong style="color:#f87171;">${escapeHtml(name)}</strong>,<br>${message}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#dc2626" style="border-radius:10px;">
<a href="https://flimkeyfii.com" style="display:inline-block;padding:15px 34px;font-size:17px;line-height:22px;font-weight:700;color:#ffffff;text-decoration:none;">Bizi Tekrar Ziyaret Edin</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:20px 24px;background-color:#101014;border-top:1px solid #542126;">
<p style="margin:0;font-size:13px;line-height:20px;color:#9ca3af;">Bu e-posta FILMKEYFİ tarafından gönderilmiştir.<br><a href="https://flimkeyfii.com" style="color:#9ca3af;text-decoration:none;">flimkeyfii.com</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

export function membershipEmail({ name, status }) {
  const active = status === 'active';
  const title = active ? 'Üyeliğiniz Aktif Edilmiştir' : 'Üyeliğiniz Bitmiştir';
  const icon = active ? '✅' : '🎬';
  const message = active
    ? "Hesabınız yönetici tarafından onaylandı. FILMKEYFİ'nin tüm premium içeriklerine, odalarına ve özelliklerine artık erişebilirsiniz. İyi seyirler!"
    : 'FILMKEYFİ premium üyeliğinizin süresi dolmuştur. Tüm verileriniz korunur; üyeliğinizi yeniden aktif ederek kaldığınız yerden devam edebilirsiniz.';
  const button = active ? 'İzlemeye Başla' : 'Üyeliği Aktif Et';
  const href = active ? 'https://flimkeyfii.com/' : 'https://flimkeyfii.com/abonelik';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#0a0a0f;table-layout:fixed;">
<tr><td align="center" valign="top" style="padding:24px 12px;">
<table role="presentation" width="500" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:500px;background-color:#17171d;border:1px solid #542126;border-radius:20px;border-collapse:separate;overflow:hidden;">
<tr><td align="center" style="padding:30px 24px 24px;background-color:#21171a;">
<img src="https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6379df5b6_351A5169-7769-4C41-8816-B20112620648.png" width="200" height="200" alt="FilmKeyfi" style="display:block;width:200px;height:200px;max-width:80%;margin:0 auto;border:0;border-radius:16px;">
</td></tr>
<tr><td align="center" style="padding:28px 28px 32px;">
<div style="font-size:44px;line-height:50px;margin-bottom:16px;">${icon}</div>
<h1 style="margin:0 0 16px;font-size:26px;line-height:34px;font-weight:800;color:#ffffff;">${title}</h1>
<p style="margin:0 0 28px;font-size:17px;line-height:27px;color:#e5e7eb;">Merhaba <strong style="color:#f87171;">${escapeHtml(name)}</strong>,<br>${message}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#dc2626" style="border-radius:10px;">
<a href="${href}" style="display:inline-block;padding:15px 34px;font-size:17px;line-height:22px;font-weight:700;color:#ffffff;text-decoration:none;">${button}</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:20px 24px;background-color:#101014;border-top:1px solid #542126;">
<p style="margin:0;font-size:13px;line-height:20px;color:#9ca3af;">Bu e-posta FILMKEYFİ tarafından gönderilmiştir.<br><a href="https://flimkeyfii.com" style="color:#9ca3af;text-decoration:none;">flimkeyfii.com</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}