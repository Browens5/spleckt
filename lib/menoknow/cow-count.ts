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

export function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

export function numberWord(n: number) {
  return String(n);
}

export function celebratePhrase(n: number) {
  if (n === 0) return "Zero cows! An empty pasture.";
  if (n === 1) return "One cow! Moo!";
  if (n === 100) return "One hundred cows! What a huge herd!";
  if (n % 10 === 0 && n >= 10) return `${n} cows! Nice counting by tens!`;
  return `${n} cows! Great counting!`;
}
