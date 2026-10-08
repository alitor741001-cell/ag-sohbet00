import { useEffect, useState } from 'react';

// Kart karesi: görsel kare kırpılır, 512'ye indirilir.
const TILE = 512;
// Zemin tona bu mesafeden yakınsa tamamen silinir; bu mesafeden uzaksa nesne
// sayılır. Arasındaki pikseller kenar yumuşatmasıdır: alfa kademeli verilir.
const CLEAR = 42 * 42;
const SOLID = 96 * 96;
// Nesne kenara değmesin: kırpma payı.
const INSET = 0.9;
// En büyük nesne bu orandan küçükse zemin silinmez: sembol boş kalmasın.
const MIN_SUBJECT = 0.06;

const SUBJECT = new Uint8Array(TILE * TILE);
const VISITED = new Uint8Array(TILE * TILE);
const HOLE = new Uint8Array(TILE * TILE);
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

/** Pikselin zemin tonuna uzaklığı. */
function floorGap(pixels, p, tone) {
  const red = pixels[p] - tone[0];
  const green = pixels[p + 1] - tone[1];
  const blue = pixels[p + 2] - tone[2];
  return red * red + green * green + blue * blue;
}

/**
 * Zemin, tona olan uzaklığına göre işaretlenir; bağlantı aranmaz. Görsellerin
 * içindeki çerçeve çizgileri dıştan içe taramayı kesiyor ve arkasında kare bir
 * zemin bırakıyordu. Burada zemin her yerde tona bakılarak atılır.
 */
function markFloor(pixels, tone) {
  const total = TILE * TILE;
  for (let index = 0; index < total; index += 1) {
    SUBJECT[index] = floorGap(pixels, index * 4, tone) > CLEAR ? 1 : 0;
  }
}

/**
 * Yalnızca en büyük nesne bırakılır. Çerçeve çizgileri ve toz nesneden ayrı
 * bileşenlerdir; böylece nesneyle birlikte onlar da atılır.
 */
function keepSubject() {
  const total = TILE * TILE;
  VISITED.fill(0);
  let seed = -1;
  let biggest = 0;

  for (let start = 0; start < total; start += 1) {
    if (!SUBJECT[start] || VISITED[start]) continue;
    let size = 0;
    let head = 0;
    let tail = 1;
    VISITED[start] = 1;
    STACK[0] = start;
    while (head < tail) {
      const index = STACK[head];
      head += 1;
      size += 1;
      const x = index % TILE;
      const y = (index - x) / TILE;
      const push = (next) => {
        if (VISITED[next] || !SUBJECT[next]) return;
        VISITED[next] = 1;
        STACK[tail] = next;
        tail += 1;
      };
      if (x > 0) push(index - 1);
      if (x < TILE - 1) push(index + 1);
      if (y > 0) push(index - TILE);
      if (y < TILE - 1) push(index + TILE);
    }
    if (size > biggest) {
      biggest = size;
      seed = start;
    }
  }

  // Nesne bulunamadıysa zemin silinmez: boş kare yerine görsel olduğu gibi kalır.
  if (seed < 0 || biggest < total * MIN_SUBJECT) return false;

  // VISITED adayları tutuyor: ikinci tarama yalnızca en büyük bileşeni işaretler.
  SUBJECT.fill(0);
  let head = 0;
  let tail = 1;
  STACK[0] = seed;
  SUBJECT[seed] = 1;
  while (head < tail) {
    const index = STACK[head];
    head += 1;
    const x = index % TILE;
    const y = (index - x) / TILE;
    const push = (next) => {
      if (SUBJECT[next] || !VISITED[next]) return;
      SUBJECT[next] = 1;
      STACK[tail] = next;
      tail += 1;
    };
    if (x > 0) push(index - 1);
    if (x < TILE - 1) push(index + 1);
    if (y > 0) push(index - TILE);
    if (y < TILE - 1) push(index + TILE);
  }
  return true;
}

/**
 * Delik doldurma: nesnenin içinde kalan açık alanlar (beyaz yüz, ışık) geri
 * getirilir. Şeffaf alan kenardan taranır; ulaşılamayan şeffaf piksel içeridedir.
 */
function fillHoles() {
  const total = TILE * TILE;
  VISITED.fill(0);
  let head = 0;
  let tail = 0;
  const seed = (index) => {
    if (VISITED[index] || SUBJECT[index]) return;
    VISITED[index] = 1;
    STACK[tail] = index;
    tail += 1;
  };
  for (let i = 0; i < TILE; i += 1) {
    seed(i);
    seed((TILE - 1) * TILE + i);
    seed(i * TILE);
    seed(i * TILE + TILE - 1);
  }
  while (head < tail) {
    const index = STACK[head];
    head += 1;
    const x = index % TILE;
    const y = (index - x) / TILE;
    const push = (next) => {
      if (VISITED[next] || SUBJECT[next]) return;
      VISITED[next] = 1;
      STACK[tail] = next;
      tail += 1;
    };
    if (x > 0) push(index - 1);
    if (x < TILE - 1) push(index + 1);
    if (y > 0) push(index - TILE);
    if (y < TILE - 1) push(index + TILE);
  }

  HOLE.fill(0);
  for (let index = 0; index < total; index += 1) {
    if (SUBJECT[index] || VISITED[index]) continue;
    SUBJECT[index] = 1;
    HOLE[index] = 1;
  }
}

/**
 * Zemin tamamen silinir; nesnenin kenar yumuşatması kademeli alfa alır ve kenara
 * sızmış zemin rengi nesnenin renginden ayıklanır.
 */
function wipeBackground(pixels, tone) {
  const total = TILE * TILE;
  for (let index = 0; index < total; index += 1) {
    const p = index * 4;
    if (!SUBJECT[index]) {
      pixels[p + 3] = 0;
      continue;
    }
    // İçeride kalan açık alanlar olduğu gibi korunur.
    if (HOLE[index]) continue;

    const gap = floorGap(pixels, p, tone);
    const amount = gap >= SOLID ? 1 : (gap - CLEAR) / (SOLID - CLEAR);
    for (let channel = 0; channel < 3; channel += 1) {
      const value = (pixels[p + channel] - (1 - amount) * tone[channel]) / amount;
      pixels[p + channel] = value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
    }
    pixels[p + 3] = Math.round(amount * 255);
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
  markFloor(pixels, tone);
  // Nesne bulunamazsa görsel olduğu gibi bırakılır.
  if (keepSubject()) {
    fillHoles();
    wipeBackground(pixels, tone);
    sharpenSubject(pixels);
  }

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

/** Oyun açılırken bütün semboller bir kez işlenir: makara dönerken hepsi hazır olur. */
export function warmEliminTiles(sources) {
  sources.forEach((src) => {
    // Hazırlık başarısız olursa kart görseli olduğu gibi gösterilir; sessizce geçilir.
    buildEliminTile(src).catch(() => {});
  });
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