/** Sayı tahtasına kişi bazlı ekleme — sunucudaki withStep ile aynı davranış.
    Gönderim anında tahtayı yerelde ilerletmek için kullanılır. */
export function withBoardStep(scores, userId, delta) {
  const list = Array.isArray(scores) ? scores : [];
  const current = Number(list.find((item) => item?.user_id === userId)?.value) || 0;
  return [...list.filter((item) => item?.user_id !== userId), { user_id: userId, value: Math.max(0, current + delta) }];
}