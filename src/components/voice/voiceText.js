// Sistem mesajlarındaki rol/çerçeve kodları ({{ROLE|...}}) kullanıcıya gösterilmez.
export const plainText = (text) => (text || '').replace(/\{\{[^}]*\}\}/g, '').replace(/\s+/g, ' ').trim();