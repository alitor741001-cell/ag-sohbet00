// ÇEYREK MAFYA motoru: rol dağıtımı, gece aksiyonları, oylama ve kazanan tespiti.
// Sunucu tek yetkilidir; roller gizli kayıtta (MafyaSecret) tutulur.

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;

// Aşama süreleri (ms).
export const TIMERS = {
  reveal: 18000,
  night: 35000,
  day: 30000,
  vote: 25000,
};

export const KARANLIK_ROLES = ['mafya', 'seytan', 'terorist'];
export const ACTION_ROLES = ['mafya', 'seytan', 'terorist', 'polis', 'doktor', 'komiser', 'gozcu'];

export const ROLE_NAMES = {
  mafya: 'MAFYA',
  seytan: 'ŞEYTAN',
  terorist: 'TERÖRİST',
  polis: 'POLİS',
  doktor: 'DOKTOR',
  komiser: 'KOMİSER',
  gozcu: 'GÖZCÜ',
  vatandas: 'VATANDAŞ',
};

export function isKaranlik(role) {
  return KARANLIK_ROLES.includes(role);
}

export function hasAction(role) {
  return ACTION_ROLES.includes(role);
}

// Oyuncu sayısına göre dengeli rol listesi: karanlık taraf her zaman azınlıktadır.
export function roleDeck(count) {
  const decks = {
    4: ['mafya', 'polis', 'doktor', 'vatandas'],
    5: ['mafya', 'polis', 'doktor', 'gozcu', 'vatandas'],
    6: ['mafya', 'seytan', 'polis', 'doktor', 'komiser', 'gozcu'],
    7: ['mafya', 'terorist', 'polis', 'doktor', 'komiser', 'gozcu', 'vatandas'],
    8: ['mafya', 'seytan', 'terorist', 'polis', 'doktor', 'komiser', 'gozcu', 'vatandas'],
  };
  if (decks[count]) return decks[count];
  if (count < MIN_PLAYERS) return [];
  return decks[MAX_PLAYERS];
}

export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

export function assignRoles(players) {
  const deck = shuffle(roleDeck(players.length));
  return players.map((player, index) => ({ user_id: player.user_id, role: deck[index] || 'vatandas' }));
}

// Kazanan taraf: karanlık taraf şehri yakalarsa o kazanır, tümü yok edilirse şehir kazanır.
export function winnerOf(players) {
  const alive = players.filter((player) => player.alive !== false);
  if (!alive.length) return 'karanlik';
  const karanlik = alive.filter((player) => isKaranlik(player.role)).length;
  if (!karanlik) return 'sehir';
  if (karanlik >= alive.length - karanlik) return 'karanlik';
  return '';
}

/** Gece çözümü: şeytan bloke eder, doktor korur, mafya vurur, terörist bombalar.
    Oyuncuya özel bilgiler (sorgu, gözetleme, rol tespiti) not olarak döner. */
export function resolveNight({ players, roles, actions, round }) {
  const roleOf = new Map((roles || []).map((entry) => [entry.user_id, entry.role]));
  const nameOf = new Map((players || []).map((entry) => [entry.user_id, entry.name || 'Oyuncu']));
  const aliveIds = new Set((players || []).filter((entry) => entry.alive !== false).map((entry) => entry.user_id));
  const mine = (actions || []).filter((entry) => entry.round_no === round && aliveIds.has(entry.user_id));
  const firstOf = (role) => mine.find((entry) => entry.role === role) || null;
  const label = (id) => nameOf.get(id) || 'Oyuncu';

  const devil = firstOf('seytan');
  const blockedIds = new Set(devil && devil.target_id ? [devil.target_id] : []);
  // Bloke edilen oyuncunun gücü bu gece işlemez.
  const active = (role) => {
    const entry = firstOf(role);
    return entry && !blockedIds.has(entry.user_id) ? entry : null;
  };

  const doctor = active('doktor');
  const guardedIds = new Set(doctor && doctor.target_id ? [doctor.target_id] : []);

  const struck = [];
  const strikes = ['mafya', 'terorist'].map((role) => active(role)).filter(Boolean);
  strikes.forEach((entry) => {
    if (!entry.target_id || !aliveIds.has(entry.target_id)) return;
    if (guardedIds.has(entry.target_id)) return;
    struck.push(entry.target_id);
  });
  const deaths = [...new Set(struck)];

  const notes = [];
  const komiserUsed = [];
  const mafya = active('mafya');
  if (mafya && mafya.target_id) {
    notes.push({ user_id: mafya.user_id, round_no: round, text: `${label(mafya.target_id)} adlı oyuncuyu vurdun.` });
  }
  const terorist = active('terorist');
  if (terorist && terorist.target_id) {
    notes.push({ user_id: terorist.user_id, round_no: round, text: `${label(terorist.target_id)} adlı oyuncuya bomba yerleştirdin.` });
  }
  if (doctor && doctor.target_id) {
    const saved = strikes.some((entry) => entry.target_id === doctor.target_id);
    notes.push({
      user_id: doctor.user_id,
      round_no: round,
      text: saved
        ? `${label(doctor.target_id)} adlı oyuncuyu korudun — gece gelen saldırı boşa gitti.`
        : `${label(doctor.target_id)} adlı oyuncuyu korudun.`,
    });
  }
  if (devil && devil.target_id) {
    notes.push({ user_id: devil.user_id, round_no: round, text: `${label(devil.target_id)} adlı oyuncunun gücünü bloke ettin.` });
    if (hasAction(roleOf.get(devil.target_id))) {
      notes.push({ user_id: devil.target_id, round_no: round, text: 'Bu gece gücün engellendi; aksiyonun işlemedi.' });
    }
  }
  const polis = active('polis');
  if (polis && polis.target_id) {
    notes.push({
      user_id: polis.user_id,
      round_no: round,
      text: `Sorgun: ${label(polis.target_id)} → ${isKaranlik(roleOf.get(polis.target_id)) ? 'KARANLIK TARAFTA' : 'TEMİZ'}.`,
    });
  }
  const komiser = active('komiser');
  if (komiser && komiser.target_id) {
    notes.push({
      user_id: komiser.user_id,
      round_no: round,
      text: `Rol tespiti: ${label(komiser.target_id)} → ${ROLE_NAMES[roleOf.get(komiser.target_id)] || 'BİLİNMİYOR'}. Gücün tükendi.`,
    });
    komiserUsed.push(komiser.user_id);
  }
  const gozcu = active('gozcu');
  if (gozcu && gozcu.target_id) {
    const visitors = [...new Set(mine
      .filter((entry) => entry.target_id === gozcu.target_id && entry.user_id !== gozcu.user_id)
      .map((entry) => label(entry.user_id)))];
    notes.push({
      user_id: gozcu.user_id,
      round_no: round,
      text: visitors.length
        ? `${label(gozcu.target_id)} adlı oyuncuyu bu gece şunlar ziyaret etti: ${visitors.join(', ')}.`
        : `${label(gozcu.target_id)} adlı oyuncuyu bu gece kimse ziyaret etmedi.`,
    });
  }

  const summary = deaths.length
    ? `Gece ${round}: ${deaths.map(label).join(', ')} hayatını kaybetti.`
    : `Gece ${round}: Bu gece kimse ölmedi.`;

  return { deaths, notes, komiserUsed, summary };
}

/** Gündüz oylaması: en çok oyu alan gönderilir; eşitlikte kimse gönderilmez. */
export function tallyVotes(votes, players) {
  const nameOf = new Map((players || []).map((entry) => [entry.user_id, entry.name || 'Oyuncu']));
  const aliveIds = new Set((players || []).filter((entry) => entry.alive !== false).map((entry) => entry.user_id));
  const counts = new Map();
  (votes || []).forEach((entry) => {
    if (!aliveIds.has(entry.user_id) || !aliveIds.has(entry.target_id)) return;
    counts.set(entry.target_id, (counts.get(entry.target_id) || 0) + 1);
  });
  const rows = [...counts.entries()]
    .map(([target_id, count]) => ({ target_id, target_name: nameOf.get(target_id) || 'Oyuncu', count }))
    .sort((left, right) => right.count - left.count);
  const top = rows[0];
  const tied = top ? rows.filter((row) => row.count === top.count).length > 1 : false;
  return { rows, eliminated: top && !tied ? top.target_id : '' };
}