import { base44 } from '@/api/base44Client';

/** PK işlemleri backend üzerinden yürür: davet, kabul, başla, ses, rövanş, ayrıl. */
export default async function pkApi(action, payload = {}) {
  const response = await base44.functions.invoke('pk-service', { action, ...payload });
  return response?.data || {};
}