// Gameplay has priority over refreshes; retry waits never occupy the queue.
const jobs = [];
let running = false;
let blockedUntil = 0;
let wakeTimer;
const priority = { cashout: 0, bet: 1, setAutoValue: 2, setAuto: 2, changeBet: 2, ledger: 3, state: 4 };
function pump() {
  clearTimeout(wakeTimer);
  if (running || !jobs.length) return;
  const wait = blockedUntil - Date.now();
  if (wait > 0) { wakeTimer = setTimeout(pump, wait); return; }
  jobs.sort((a, b) => a.priority - b.priority);
  const job = jobs.shift();
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