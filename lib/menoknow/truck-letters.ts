/** Monster truck letter game — listen, case match, and starting sounds. */

export type LetterMode = "listen" | "case" | "picture";

export type TruckLevelId =
  | "listen-af"
  | "listen-aj"
  | "case-af"
  | "case-am"
  | "picture-af"
  | "picture-al";

export type PictureId =
  | "apple"
  | "ball"
  | "cat"
  | "dog"
  | "egg"
  | "fish"
  | "goat"
  | "hat"
  | "ice"
  | "jam"
  | "kite"
  | "leaf"
  | "moon"
  | "nest"
  | "octopus"
  | "pig"
  | "queen"
  | "rainbow"
  | "sun"
  | "tree"
  | "umbrella"
  | "van"
  | "whale"
  | "box"
  | "yarn"
  | "zebra";

export type LetterItem = {
  letter: string; // uppercase A-Z
  picture: PictureId;
  word: string;
};

export const LETTER_BANK: LetterItem[] = [
  { letter: "A", picture: "apple", word: "apple" },
  { letter: "B", picture: "ball", word: "ball" },
  { letter: "C", picture: "cat", word: "cat" },
  { letter: "D", picture: "dog", word: "dog" },
  { letter: "E", picture: "egg", word: "egg" },
  { letter: "F", picture: "fish", word: "fish" },
  { letter: "G", picture: "goat", word: "goat" },
  { letter: "H", picture: "hat", word: "hat" },
  { letter: "I", picture: "ice", word: "ice" },
  { letter: "J", picture: "jam", word: "jam" },
  { letter: "K", picture: "kite", word: "kite" },
  { letter: "L", picture: "leaf", word: "leaf" },
  { letter: "M", picture: "moon", word: "moon" },
  { letter: "N", picture: "nest", word: "nest" },
  { letter: "O", picture: "octopus", word: "octopus" },
  { letter: "P", picture: "pig", word: "pig" },
  { letter: "Q", picture: "queen", word: "queen" },
  { letter: "R", picture: "rainbow", word: "rainbow" },
  { letter: "S", picture: "sun", word: "sun" },
  { letter: "T", picture: "tree", word: "tree" },
  { letter: "U", picture: "umbrella", word: "umbrella" },
  { letter: "V", picture: "van", word: "van" },
  { letter: "W", picture: "whale", word: "whale" },
  { letter: "X", picture: "box", word: "box" }, // ending sound buddy for X
  { letter: "Y", picture: "yarn", word: "yarn" },
  { letter: "Z", picture: "zebra", word: "zebra" },
];

export type TruckLevel = {
  id: TruckLevelId;
  mode: LetterMode;
  title: string;
  blurb: string;
  /** Inclusive end letter, e.g. "F" means A–F. */
  through: string;
  rounds: number;
};

export const TRUCK_LEVELS: TruckLevel[] = [
  {
    id: "listen-af",
    mode: "listen",
    title: "Rev & listen",
    blurb: "Hear a letter — pick it. A to F.",
    through: "F",
    rounds: 8,
  },
  {
    id: "listen-aj",
    mode: "listen",
    title: "Loud letters",
    blurb: "Listen carefully. A to J.",
    through: "J",
    rounds: 8,
  },
  {
    id: "case-af",
    mode: "case",
    title: "Big & little",
    blurb: "Match A with a. Letters A to F.",
    through: "F",
    rounds: 8,
  },
  {
    id: "case-am",
    mode: "case",
    title: "Case ramp",
    blurb: "Upper and lower partners. A to M.",
    through: "M",
    rounds: 8,
  },
  {
    id: "picture-af",
    mode: "picture",
    title: "Picture jump",
    blurb: "What letter starts the picture? A to F.",
    through: "F",
    rounds: 8,
  },
  {
    id: "picture-al",
    mode: "picture",
    title: "Starting sound track",
    blurb: "Match the first letter. A to L.",
    through: "L",
    rounds: 10,
  },
];

export function getTruckLevel(id: TruckLevelId) {
  return TRUCK_LEVELS.find((level) => level.id === id) ?? TRUCK_LEVELS[0]!;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function poolThrough(through: string) {
  const end = through.toUpperCase().charCodeAt(0);
  return LETTER_BANK.filter((item) => item.letter.charCodeAt(0) <= end);
}

export type ChoiceTile = {
  id: string;
  label: string;
  letter: string;
};

export type TruckRound = {
  mode: LetterMode;
  target: LetterItem;
  /** Prompt side: what the child sees/hears about. */
  promptLabel: string;
  promptCase: "upper" | "lower" | "none";
  choices: ChoiceTile[];
  /** Correct choice id. */
  answerId: string;
};

export function freshTruckRound(
  level: TruckLevel,
  avoidLetter?: string,
): TruckRound {
  const pool = poolThrough(level.through);
  const candidates =
    avoidLetter != null
      ? pool.filter((item) => item.letter !== avoidLetter)
      : pool;
  const target =
    candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0]!;

  if (level.mode === "listen") {
    const distractors = shuffle(
      pool.filter((item) => item.letter !== target.letter),
    ).slice(0, 3);
    const choices = shuffle([target, ...distractors]).map((item) => ({
      id: `L-${item.letter}`,
      label: item.letter,
      letter: item.letter,
    }));
    return {
      mode: "listen",
      target,
      promptLabel: target.letter,
      promptCase: "none",
      choices,
      answerId: `L-${target.letter}`,
    };
  }

  if (level.mode === "case") {
    const showUpper = Math.random() < 0.5;
    const promptLabel = showUpper
      ? target.letter
      : target.letter.toLowerCase();
    const distractors = shuffle(
      pool.filter((item) => item.letter !== target.letter),
    ).slice(0, 3);
    const choices = shuffle([target, ...distractors]).map((item) => ({
      id: `C-${item.letter}`,
      label: showUpper ? item.letter.toLowerCase() : item.letter,
      letter: item.letter,
    }));
    return {
      mode: "case",
      target,
      promptLabel,
      promptCase: showUpper ? "upper" : "lower",
      choices,
      answerId: `C-${target.letter}`,
    };
  }

  // picture — X uses "box" (ends with x); say so in speech layer
  const distractors = shuffle(
    pool.filter((item) => item.letter !== target.letter),
  ).slice(0, 3);
  const choices = shuffle([target, ...distractors]).map((item) => ({
    id: `P-${item.letter}`,
    label: item.letter,
    letter: item.letter,
  }));
  return {
    mode: "picture",
    target,
    promptLabel: target.word,
    promptCase: "none",
    choices,
    answerId: `P-${target.letter}`,
  };
}

export function promptSpeech(round: TruckRound) {
  if (round.mode === "listen") {
    return `Listen. Find the letter ${round.target.letter}.`;
  }
  if (round.mode === "case") {
    if (round.promptCase === "upper") {
      return `This is big ${round.target.letter}. Find little ${round.target.letter.toLowerCase()}.`;
    }
    return `This is little ${round.target.letter.toLowerCase()}. Find big ${round.target.letter}.`;
  }
  if (round.target.letter === "X") {
    return `Box ends with X. Find the letter X.`;
  }
  return `${round.target.word} starts with ${round.target.letter}. Find ${round.target.letter}.`;
}

export const TRICK_NAMES = [
  "Wheelie!",
  "Big air!",
  "Tailwhip!",
  "Mud splash!",
  "Roof scrape!",
  "Victory hop!",
] as const;

export function randomTrick() {
  return TRICK_NAMES[Math.floor(Math.random() * TRICK_NAMES.length)]!;
}
