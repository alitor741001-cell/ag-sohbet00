import '@/components/vip/vip.css';
export const vipVars = (theme) => theme ? { '--vip-accent': theme.accent, '--vip-secondary': theme.secondary } : {};
export const vipLook = (profile, kind) => {
  const expiry = Date.parse(profile?.vip_expires_at || '');
  if (profile?.vip_level < 5 || (!Number.isNaN(expiry) && expiry <= Date.now())) return null;
  return profile?.vip_look?.[kind] || null;
};