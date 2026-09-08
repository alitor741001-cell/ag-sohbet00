function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

export function membershipEmail({ name, status }) {
  const active = status === 'active';
  const title = active ? 'Üyeliğiniz Aktif Edilmiştir' : 'Üyeliğiniz Bitmiştir';
  const icon = active ? '✅' : '🎬';
  const message = active
    ? "Hesabınız yönetici tarafından onaylandı. FILMKEYFİ'nin tüm premium içeriklerine, odalarına ve özelliklerine artık erişebilirsiniz. İyi seyirler!"
    : 'FILMKEYFİ premium üyeliğinizin süresi dolmuştur. Tüm verileriniz korunur; üyeliğinizi yeniden aktif ederek kaldığınız yerden devam edebilirsiniz.';
  const button = active ? 'İzlemeye Başla' : 'Üyeliği Aktif Et';
  const href = active ? 'https://flimkeyfii.base44.app/' : 'https://flimkeyfii.base44.app/abonelik';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#0a0a0f;table-layout:fixed;">
<tr><td align="center" valign="top" style="padding:24px 12px;">
<table role="presentation" width="500" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:500px;background-color:#17171d;border:1px solid #542126;border-radius:20px;border-collapse:separate;overflow:hidden;">
<tr><td align="center" style="padding:32px 24px 20px;background-color:#21171a;">
<img src="https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3108d3b4e_351A5169-7769-4C41-8816-B20112620648.png" width="72" height="72" alt="FILMKEYFİ" style="display:block;width:72px;height:72px;margin:0 auto 14px;border:0;border-radius:14px;">
<div style="font-size:30px;line-height:36px;font-weight:900;letter-spacing:2px;color:#ef4444;">FILMKEYFİ</div>
<div style="margin-top:7px;font-size:11px;line-height:16px;color:#9ca3af;letter-spacing:3px;text-transform:uppercase;">Sinematik Deneyim</div>
</td></tr>
<tr><td align="center" style="padding:28px 28px 32px;">
<div style="font-size:44px;line-height:50px;margin-bottom:16px;">${icon}</div>
<h1 style="margin:0 0 14px;font-size:24px;line-height:32px;font-weight:700;color:#ffffff;">${title}</h1>
<p style="margin:0 0 26px;font-size:16px;line-height:25px;color:#b0b4bd;">Merhaba <strong style="color:#ef4444;">${escapeHtml(name)}</strong>,<br>${message}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#dc2626" style="border-radius:10px;">
<a href="${href}" style="display:inline-block;padding:14px 30px;font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">${button}</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:20px 24px;background-color:#101014;border-top:1px solid #542126;">
<p style="margin:0;font-size:12px;line-height:19px;color:#6b7280;">Bu e-posta FILMKEYFİ tarafından gönderilmiştir.<br>flimkeyfii.base44.app</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}