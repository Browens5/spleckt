/** Cow counting game — pedagogical helpers for ages ~3–4 (scaffolded to 100). */

export type CountLevelId =
  | "starter"
  | "growing"
  | "teens"
  | "tens"
  | "big"
  | "full";

export type CountMode = "count" | "build";

export type CountLevel = {
  id: CountLevelId;
  title: string;
  blurb: string;
  min: number;
  max: number;
  /** Prefer decade targets (10, 20, …) for place-value practice. */
  decadesOnly?: boolean;
  /** Rounds before a level celebration. */
  rounds: number;
};

export const COUNT_LEVELS: CountLevel[] = [
  {
    id: "starter",
    title: "Little pasture",
    blurb: "0 to 5 cows — tap each one.",
    min: 0,
    max: 5,
    rounds: 8,
  },
  {
    id: "growing",
    title: "Growing herd",
    blurb: "0 to 10 — count every cow.",
    min: 0,
    max: 10,
    rounds: 8,
  },
  {
    id: "teens",
    title: "Teen town",
    blurb: "11 to 20 — teens are tricky!",
    min: 11,
    max: 20,
    rounds: 8,
  },
  {
    id: "tens",
    title: "Tens pens",
    blurb: "10, 20, 30… count by tens.",
    min: 10,
    max: 100,
    decadesOnly: true,
    rounds: 8,
  },
  {
    id: "big",
    title: "Big herd",
    blurb: "Up to 50 — pens of ten help.",
    min: 0,
    max: 50,
    rounds: 8,
  },
  {
    id: "full",
    title: "Full farm",
    blurb: "0 to 100 — group by tens.",
    min: 0,
    max: 100,
    rounds: 10,
  },
];

export function getLevel(id: CountLevelId) {
  return COUNT_LEVELS.find((level) => level.id === id) ?? COUNT_LEVELS[0];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickTarget(level: CountLevel, avoid?: number) {
  if (level.decadesOnly) {
    const decades: number[] = [];
    for (let n = level.min; n <= level.max; n += 10) decades.push(n);
    const pool = avoid == null ? decades : decades.filter((n) => n !== avoid);
    return pool[randInt(0, Math.max(0, pool.length - 1))] ?? level.min;
  }

  let target = randInt(level.min, level.max);
  if (avoid != null && level.max > level.min) {
    let guard = 0;
    while (target === avoid && guard < 12) {
      target = randInt(level.min, level.max);
      guard += 1;
    }
  }
  return target;
}

/** Nearby distractors — close misses teach better than random far numbers. */
export function buildChoices(target: number, level: CountLevel, count = 4) {
  const set = new Set<number>([target]);
  const candidates: number[] = [];

  if (level.decadesOnly) {
    for (const delta of [-20, -10, 10, 20, -30, 30]) {
      const n = target + delta;
      if (n >= level.min && n <= level.max) candidates.push(n);
    }
  } else {
    for (const delta of [-1, 1, -2, 2, -3, 3, -5, 5, -10, 10]) {
      const n = target + delta;
      if (n >= level.min && n <= level.max) candidates.push(n);
    }
    // Zero special: empty pasture distractors stay small.
    if (target === 0) candidates.push(1, 2, 3);
  }

  for (const n of shuffle(candidates)) {
    if (set.size >= count) break;
    set.add(n);
  }

  while (set.size < count) {
    set.add(randInt(level.min, level.max));
  }

  return shuffle([...set]);
}

export type CowLayout = {
  tens: number;
  ones: number;
  /** Show individual cows (true for small herds). */
  showIndividuals: boolean;
};

/** Unitizing: group by tens once counts get large. */
export function layoutForCount(n: number): CowLayout {
  if (n <= 12) {
    return { tens: 0, ones: n, showIndividuals: true };
  }
  if (n <= 20) {
    return { tens: 0, ones: n, showIndividuals: true };
  }
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return { tens, ones, showIndividuals: false };
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

/** Spoken number words sound more natural than digit strings. */
export function numberWord(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 20) return ONES[n] ?? String(n);
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return one === 0 ? TENS[ten]! : `${TENS[ten]}-${ONES[one]}`;
  }
  if (n === 100) return "one hundred";
  return String(n);
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (/en(-|_)?(us|gb|au|ie|za)?/.test(voice.lang.toLowerCase())) score += 8;
  if (voice.localService) score += 2;
  // Prefer natural / neural / premium named voices.
  if (/natural|neural|premium|enhanced|siri|aria|jenny|sara|guy|davis|ryan|sonia|natasha|samantha|karen|moira|daniel|kate|oliver|google us|google uk/.test(name)) {
    score += 12;
  }
  // Avoid obviously robotic / compact voices.
  if (/compact|espeak|robot|novelty|whisper|zarvox|trinoids|bad news|good news|bubbles|boing|organ/.test(name)) {
    score -= 20;
  }
  if (/female|woman|girl|samantha|karen|moira|aria|jenny|sara|sonia|kate/.test(name)) {
    score += 3; // warm storyteller vibe for preschool
  }
  return score;
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    cachedVoice = null;
    return null;
  }
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  cachedVoice = ranked[0] ?? null;
  return cachedVoice;
}

function warmVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const refresh = () => {
    cachedVoice = undefined;
    pickNaturalVoice();
  };
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh, {
    once: true,
  });
}

if (typeof window !== "undefined") {
  warmVoices();
}

export function speakText(text: string, opts?: { interject?: string }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const voice = pickNaturalVoice();
  const utterance = new SpeechSynthesisUtterance(
    opts?.interject ? `${opts.interject}. ${text}` : text,
  );
  if (voice) utterance.voice = voice;
  // Closer to conversational storytelling than a chirpy robot.
  utterance.rate = 0.9;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

/** Speak a number using natural words ("twenty-three"). */
export function speakNumber(n: number) {
  speakText(numberWord(n));
}

export function celebratePhrase(n: number) {
  if (n === 0) return "Zero cows! An empty pasture.";
  if (n === 1) return "One cow! Moo!";
  if (n === 100) return "One hundred cows! What a huge herd!";
  if (n % 10 === 0 && n >= 10) {
    return `${numberWord(n)} cows! Nice counting by tens!`;
  }
  return `${numberWord(n)} cows! Great counting!`;
}
