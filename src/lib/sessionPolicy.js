const MULTI_DEVICE_EMAILS = new Set(['alitor7474@gmail.com']);

export function isMultiDeviceExempt(user) {
  return user?.role === 'admin' || MULTI_DEVICE_EMAILS.has((user?.email || '').trim().toLowerCase());
}