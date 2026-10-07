// Gameplay has priority over refreshes; retry waits never occupy the queue.
const jobs = [];
let running = false;
let blockedUntil = 0;
let wakeTimer;
// Uçuş tik'i oyun isteği sayılır (2): yoğunluk molası roketin çakılma anını
// öğrenmesini engellemez, ekran gerçek patlama noktasından kopmaz.
const priority = { cashout: 0, bet: 1, tick: 2, setAutoValue: 2, setAuto: 2, changeBet: 2, ledger: 3, state: 4 };
function pump() {
  clearTimeout(wakeTimer);
  if (running || !jobs.length) return;
  const wait = blockedUntil - Date.now();
  // Yoğunluk molası yalnızca tazeleme isteklerini bekletir; bahis ve çekilme
  // her zaman sıraya girer, oyuncu butona bastığı an cevap alır.
  const runnable = jobs.filter((job) => wait <= 0 || job.priority <= 2);
  if (!runnable.length) {
    wakeTimer = setTimeout(pump, Math.max(250, wait));
    return;
  }
  const job = runnable.sort((a, b) => a.priority - b.priority)[0];
  jobs.splice(jobs.indexOf(job), 1);
  running = true;
  Promise.resolve().then(job.run).then(job.resolve, job.reject).finally(() => {
    running = false;
    pump();
  });
}
export function deferRocketRequests(ms) {
  blockedUntil = Math.max(blockedUntil, Date.now() + ms);
}
export function enqueueRocketRequest(action, run) {
  return new Promise((resolve, reject) => {
    jobs.push({ priority: priority[action] ?? 3, run, resolve, reject });
    pump();
  });
}