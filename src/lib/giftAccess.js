import { broadcasterState } from '@/lib/broadcaster';

/**
 * Elmas ve bakiye bölümü yalnızca yayıncı hesaplara açıktır.
 * Yan hesap nedeniyle yayıncılığı iptal edilen hesap da yayıncı sayılmadığı için
 * bölüm kapanır; yönetici panel sahibi olarak bölümü görebilir.
 */
export function giftBoxLocked(user) {
  if (!user || user.role === 'admin') return false;
  return !broadcasterState(user).active;
}