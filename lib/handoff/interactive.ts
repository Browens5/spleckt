export type InteractiveCalloutTone = "tip" | "warn" | "fun";

export type OrderMinigame = {
  type: "minigame";
  kind: "order";
  id: string;
  title: string;
  prompt: string;
  items: string[];
  correctOrder: number[];
  success: string;
};

export type MatchMinigame = {
  type: "minigame";
  kind: "match";
  id: string;
  title: string;
  prompt: string;
  pairs: Array<{ term: string; definition: string }>;
  success: string;
};

export type BatonMinigame = {
  type: "minigame";
  kind: "baton";
  id: string;
  title: string;
  prompt: string;
  success: string;
};

export type RapidMinigame = {
  type: "minigame";
  kind: "rapid";
  id: string;
  title: string;
  prompt: string;
  rounds: Array<{ statement: string; correct: boolean; explanation: string }>;
  passScore: number;
  success: string;
};

export type MinigameBlock =
  | OrderMinigame
  | MatchMinigame
  | BatonMinigame
  | RapidMinigame;

export type InteractiveBlock =
  | { type: "text"; markdown: string }
  | {
      type: "video";
      title: string;
      youtubeId: string;
      caption?: string;
      sourceLabel?: string;
      sourceUrl?: string;
    }
  | {
      type: "resource";
      title: string;
      url: string;
      description?: string;
    }
  | {
      type: "callout";
      tone: InteractiveCalloutTone;
      title: string;
      body: string;
    }
  | {
      type: "checklist";
      title: string;
      items: string[];
    }
  | {
      type: "scenario";
      title: string;
      situation: string;
      choices: Array<{ label: string; feedback: string; correct?: boolean }>;
    }
  | {
      type: "quiz";
      id: string;
      prompt: string;
      choices: string[];
      correctIndex: number;
      explanation: string;
    }
  | MinigameBlock;

export type InteractiveChapter = {
  id: string;
  title: string;
  eyebrow?: string;
  blocks: InteractiveBlock[];
};

export type InteractiveLesson = {
  version: 1;
  interactive: true;
  chapters: InteractiveChapter[];
};

export function parseInteractiveLesson(
  raw: string | null | undefined,
): InteractiveLesson | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const lesson = parsed as Partial<InteractiveLesson>;
    if (lesson.interactive !== true || lesson.version !== 1) return null;
    if (!Array.isArray(lesson.chapters) || lesson.chapters.length === 0) {
      return null;
    }
    return lesson as InteractiveLesson;
  } catch {
    return null;
  }
}
