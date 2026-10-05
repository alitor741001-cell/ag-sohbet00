/**
 * Ajans komisyonu bakiyesi: yayıncıların tamamladığı kotalardan ajans sahibine ve
 * asistanlara yazılan dolar tutarları. Kota tamamlandığı an kayıt oluştuğu için
 * tutar hediye kutusu bakiyesine anında eklenir (beklemeye alınmaz).
 */

const round = (value: any) => Math.round((Number(value) || 0) * 100) / 100;

/** Kişinin ajans sahibi komisyonu ve asistanlık payı toplamı (dolar). */
export async function agencyCommissionTotals(base44: any, userId: string) {
  const [ownerRows, assistantRows] = await Promise.all([
    // Yayıncıların kotasından ajans sahibine yazılan komisyon.
    base44.asServiceRole.entities.QuotaReward
      .filter({ agency_owner_id: userId }, '-created_date', 1000).catch(() => []),
    // Asistanın davet ettiği yayıncıların kotasından kendisine yazılan pay.
    base44.asServiceRole.entities.QuotaReward
      .filter({ user_id: userId, kind: 'assistant' }, '-created_date', 1000).catch(() => []),
  ]);
  // Asistan satırlarında agency_amount sıfırdır: aynı kayıt iki kez sayılmaz.
  const owner = round((ownerRows || []).reduce((sum: number, row: any) => sum + (Number(row?.agency_amount) || 0), 0));
  const assistant = round((assistantRows || []).reduce((sum: number, row: any) => sum + (Number(row?.amount) || 0), 0));
  return { owner, assistant, total: round(owner + assistant) };
}