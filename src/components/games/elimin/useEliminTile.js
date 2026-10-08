import { useEffect, useState } from 'react';

// Kart karesi: görsel kare kırpılır, 512'ye indirilir.
const TILE = 512;
// Sınır yumuşatma: bu mesafenin altındaki pikseller tamamen şeffaf, üstündekiler tamamen opak.
const CLEAR = 26 * 26;
const SOLID = 70 * 70;
// Zemin taraması: komşu farkı bu eşiğin altındaysa akış sürer — zeminin yumuşak
// ışık halkası da silinir, nesnenin kenarında akış durur. Zemine uzaklık üst
// sınırı aşılırsa piksel zemin sayılmaz: nesnenin beyaz/krem yerleri korunur.
const STEP = 20 * 20;
const FLOOR = 72 * 72;
// Zemin sınırında kalan ışık halkası bu kalınlıkta temizlenir.
const HALO = 2;
// Nesne kenara değmesin: kırpma payı ve leke eşiği.
const INSET = 0.9;
const SPECK = 30;

const MASK = new Uint8Array(TILE * TILE);
const EDGE = new Uint8Array(TILE * TILE);
const SOLID_PIXELS = new Uint8Array(TILE * TILE);
const VISITED = new Uint8Array(TILE * TILE);
const STACK = new Int32Array(TILE * TILE);

const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Görsel yüklenemedi.'));
    image.src = src;
  });
}

/** Karenin dış bandının medyan rengi: atılacak zeminin tonu. */
function backgroundTone(pixels) {
  const band = 6;
  const samples = [[], [], []];
  const sample = (x, y) => {
    const p = (y * TILE + x) * 4;
    samples[0].push(pixels[p]);
    samples[1].push(pixels[p + 1]);
    samples[2].push(pixels[p + 2]);
  };
  for (let y = 0; y < TILE; y += 1) {
    for (let edge = 0; edge < band; edge += 1) {
      sample(edge, y);
      sample(TILE - 1 - edge, y);
    }
  }
  for (let x = band; x < TILE - band; x += 1) {
    for (let edge = 0; edge < band; edge += 1) {
      sample(x, edge);
      sample(x, TILE - 1 - edge);
    }
  }
  return samples.map((list) => {
    list.sort((a, b) => a - b);
    return list[list.length >> 1];
  });
}

/** İki pikselin renk farkı. */
function colorGap(pixels, a, b) {
  const red = pixels[a] - pixels[b];
  const green = pixels[a + 1] - pixels[b + 1];
  const blue = pixels[a + 2] - pixels[b + 2];
  return red * red + green * green + blue * blue;
}

/** Pikselin zemin tonuna uzaklığı. */
function floorGap(pixels, p, tone) {
  const red = pixels[p] - tone[0];
  const green = pixels[p + 1] - tone[1];
  const blue = pixels[p + 2] - tone[2];
  return red * red + green * green + blue * blue;
}

/**
 * Zemini karenin dışından içeri doğru tarar. Yumuşak geçişler (ışık halkası,
 * ızgara çizgisi) boyunca ilerler, nesnenin kenarında komşu farkı büyüdüğü
 * için durur; böylece nesnenin kendi içindeki benzer renkler korunur.
 */
function markBackground(pixels, tone) {
  MASK.fill(0);
  let tail = 0;
  const seed = (index) => {
    if (MASK[index]) return;
    MASK[index] = 1;
    STACK[tail] = index;
    tail += 1;
  };

  // Karenin en dış halkası her zaman zemin sayılır: kırpma artıkları kalmaz.
  for (let i = 0; i < TILE; i += 1) {
    seed(i);
    seed((TILE - 1) * TILE + i);
    seed(i * TILE);
    seed(i * TILE + TILE - 1);
  }

  let head = 0;
  while (head < tail) {
    const index = STACK[head];
    head += 1;
    const x = index % TILE;
    const y = (index - x) / TILE;
    const p = index * 4;
    const neighbours = [
      x > 0 ? index - 1 : -1,
      x < TILE - 1 ? index + 1 : -1,
      y > 0 ? index - TILE : -1,
      y < TILE - 1 ? index + TILE : -1,
    ];
    for (const next of neighbours) {
      if (next < 0 || MASK[next]) continue;
      const q = next * 4;
      if (colorGap(pixels, q, p) > STEP) continue;
      if (floorGap(pixels, q, tone) > FLOOR) continue;
      MASK[next] = 1;
      STACK[tail] = next;
      tail += 1;
    }
  }
}

/** Zeminin hemen çevresindeki şerit: nesnenin kirli saçılması burada temizlenir. */
function markHalo() {
  EDGE.fill(0);
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const index = y * TILE + x;
      if (MASK[index]) continue;
      let touching = false;
      for (let dy = -HALO; dy <= HALO && !touching; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= TILE) continue;
        for (let dx = -HALO; dx <= HALO; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= TILE) continue;
          if (MASK[ny * TILE + nx]) {
            touching = true;
            break;
          }
        }
      }
      if (touching) EDGE[index] = 1;
    }
  }
}

/**
 * Zemin tamamen silinir; sınırda kalan ışık halkası yumuşak geçişle
 * şeffaflaştırılır ve zeminden sızan renk nesnenin renginden ayıklanır.
 */
function wipeBackground(pixels, tone) {
  for (let index = 0; index < TILE * TILE; index += 1) {
    const p = index * 4;
    if (MASK[index]) {
      pixels[p + 3] = 0;
      continue;
    }
    if (!EDGE[index]) continue;

    const gap = floorGap(pixels, p, tone);
    const amount = gap <= CLEAR ? 0 : gap >= SOLID ? 1 : (gap - CLEAR) / (SOLID - CLEAR);
    if (amount <= 0) {
      pixels[p + 3] = 0;
      continue;
    }
    for (let channel = 0; channel < 3; channel += 1) {
      const value = (pixels[p + channel] - (1 - amount) * tone[channel]) / amount;
      pixels[p + channel] = value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
    }
    pixels[p + 3] = Math.round(amount * 255);
  }
}

/** Zemin silindikten sonra kalan küçük parçacıklar (toz, çizgi artığı) atılır. */
function removeSpecks(pixels) {
  const total = TILE * TILE;
  SOLID_PIXELS.fill(0);
  VISITED.fill(0);
  for (let index = 0; index < total; index += 1) {
    SOLID_PIXELS[index] = pixels[index * 4 + 3] > 128 ? 1 : 0;
  }

  for (let start = 0; start < total; start += 1) {
    if (!SOLID_PIXELS[start] || VISITED[start]) continue;
    const members = [start];
    let speck = true;
    let head = 0;
    let tail = 1;
    STACK[0] = start;
    VISITED[start] = 1;
    while (head < tail) {
      const index = STACK[head];
      head += 1;
      const x = index % TILE;
      const y = (index - x) / TILE;
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < TILE - 1 ? index + 1 : -1,
        y > 0 ? index - TILE : -1,
        y < TILE - 1 ? index + TILE : -1,
      ];
      for (const next of neighbours) {
        if (next < 0 || VISITED[next] || !SOLID_PIXELS[next]) continue;
        VISITED[next] = 1;
        STACK[tail] = next;
        tail += 1;
        if (members.length > SPECK) speck = false;
        else members.push(next);
      }
    }
    if (speck) members.forEach((index) => { pixels[index * 4 + 3] = 0; });
  }
}

/** Nesnenin kendi pikselleri netleştirilir; şeffaf zemin bu işleme girmez. */
function sharpenSubject(pixels) {
  const source = new Uint8ClampedArray(pixels);
  const at = (x, y) => (y * TILE + x) * 4;
  for (let y = 1; y < TILE - 1; y += 1) {
    for (let x = 1; x < TILE - 1; x += 1) {
      const p = at(x, y);
      if (source[p + 3] < 255) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = source[p + channel] * 5
          - source[at(x - 1, y) + channel]
          - source[at(x + 1, y) + channel]
          - source[at(x, y - 1) + channel]
          - source[at(x, y + 1) + channel];
        pixels[p + channel] = value < 0 ? 0 : value > 255 ? 255 : value;
      }
    }
  }
}

async function process(src) {
  const image = await loadImage(src);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('Görsel okunamadı.');

  // Kare kırpma: hücre kenarları kırpılır, nesne ortada ve kenarlardan uzak kalır.
  const side = Math.min(width, height) * INSET;
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, TILE, TILE);

  const imageData = context.getImageData(0, 0, TILE, TILE);
  const pixels = imageData.data;
  const tone = backgroundTone(pixels);
  markBackground(pixels, tone);
  markHalo();
  wipeBackground(pixels, tone);
  removeSpecks(pixels);
  sharpenSubject(pixels);

  context.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Görsel işlenemedi.');
  return URL.createObjectURL(blob);
}

/** Kare kart: sembolün arkasındaki zemin silinir, nesne tahtanın üstünde durur. */
export function buildEliminTile(src) {
  const found = cache.get(src);
  if (found) return found;
  const task = process(src).then(
    (url) => {
      cache.set(src, url);
      return url;
    },
    (error) => {
      cache.delete(src);
      throw error;
    },
  );
  cache.set(src, task);
  return task;
}

/** Hazır kesilmiş görsel: işlenmişse doğrudan kullanılır, kaynak görsel bekletilmez. */
const readyTile = (src) => {
  const found = cache.get(src);
  return typeof found === 'string' ? found : null;
};

/**
 * Hazır olana kadar görselin kendisi gösterilir; ama işlenmiş görsel ilk karede
 * kullanılır. Makara dönerken onlarca kare aynı anda kurulduğu için bu şart:
 * aksi halde her kare önce zeminli kaynak görselle, sonra kesilmiş hâliyle
 * çizilir ve dönüş sırasında kare zeminler görünür.
 */
export default function useEliminTile(src) {
  const [state, setState] = useState({ src, url: readyTile(src) || src });

  useEffect(() => {
    const ready = readyTile(src);
    if (ready) {
      // Aynı görsel zaten duruyorsa yeniden çizim yapılmaz.
      setState((current) => (current.src === src && current.url === ready ? current : { src, url: ready }));
      return undefined;
    }
    let active = true;
    buildEliminTile(src)
      .then((url) => {
        if (active) setState({ src, url });
      })
      // İşleme kısıtlı tarayıcıda başarısız olursa görsel olduğu gibi gösterilir.
      .catch(() => {
        if (active) setState({ src, url: src });
      });
    return () => {
      active = false;
    };
  }, [src]);
  return state.src === src ? state.url : src;
}