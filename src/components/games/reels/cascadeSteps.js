// Tumbler adımlarının zamanlaması: karo parlar, patlar ve yerine yenisi düşer.
export const DROP_MS = 380;
export const HOLD_MS = 950;
export const EXPLODE_MS = 320;
// Son adımdan sonra son dizilimin görünmesi için küçük bir pay.
export const END_MS = 650;

/**
 * Tumbler adımlarını sırayla oynatır (dede, meyve, şeker, eliminslot).
 * steps: sunucudan gelen adımlar · wait: kesilebilir bekleme (DUR düğmesi)
 * setGrid / setWins / setExplode: adımın ekran durumu · addWin: o ana kadarki kazanç
 */
export async function playCascadeSteps(steps, { wait, setGrid, setWins, setExplode, addWin }) {
  let shown = 0;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    // Yeni dizilim sütunun üstünden düşer.
    setGrid(step.grid);
    setWins([]);
    await wait(DROP_MS);
    // Kazanan karolar parlar.
    setWins(step.wins || []);
    shown += step.amount || 0;
    addWin(shown);
    await wait(HOLD_MS);
    // Karolar patlar; sıradaki adımda yerlerine yenileri düşer.
    setExplode(true);
    await wait(EXPLODE_MS);
    setExplode(false);
  }
}