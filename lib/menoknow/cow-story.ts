import type { CountLevelId, CountMode } from "@/lib/menoknow/cow-count";

export type StoryBeat = {
  title: string;
  line: string;
  spoken: string;
};

export const STORY_INTRO: StoryBeat[] = [
  {
    title: "Sunrise on Meadow Farm",
    line: "Farmer Dot stretches, puts on a yellow hat, and hears soft moos across the hills.",
    spoken:
      "Sunrise on Meadow Farm. Farmer Dot stretches, puts on a yellow hat, and hears soft moos across the hills.",
  },
  {
    title: "The wandering herd",
    line: "The cows love to wander! Some hide behind the barn. Some nap in empty pastures — that means zero.",
    spoken:
      "The cows love to wander. Some hide behind the barn. Some nap in empty pastures. That means zero.",
  },
  {
    title: "You are the counter",
    line: "Dot needs a helper. Tap each cow, say the number, and help bring the herd home.",
    spoken:
      "Dot needs a helper. Tap each cow, say the number, and help bring the herd home.",
  },
];

export function levelStory(id: CountLevelId): StoryBeat {
  switch (id) {
    case "starter":
      return {
        title: "Little pasture",
        line: "Just a few friends today. Count carefully — even an empty field matters!",
        spoken:
          "Little pasture. Just a few friends today. Count carefully. Even an empty field matters!",
      };
    case "growing":
      return {
        title: "Growing herd",
        line: "More cows trot in from the clover. Keep tapping — one cow, one number.",
        spoken:
          "Growing herd. More cows trot in from the clover. Keep tapping. One cow, one number.",
      };
    case "teens":
      return {
        title: "Teen town",
        line: "Teen numbers are sneaky! Thirteen, fourteen… count every spotted friend.",
        spoken:
          "Teen town. Teen numbers are sneaky! Thirteen, fourteen… count every spotted friend.",
      };
    case "tens":
      return {
        title: "Tens pens",
        line: "Dot built pens of ten. Count 10, 20, 30 — like jumping on stepping stones.",
        spoken:
          "Tens pens. Dot built pens of ten. Count ten, twenty, thirty — like jumping on stepping stones.",
      };
    case "big":
      return {
        title: "Big herd",
        line: "A busy morning! Group cows in tens, then count the leftovers.",
        spoken:
          "Big herd. A busy morning! Group cows in tens, then count the leftovers.",
      };
    case "full":
      return {
        title: "Full farm",
        line: "The whole farm is awake — up to one hundred cows. You’ve got this, helper!",
        spoken:
          "Full farm. The whole farm is awake — up to one hundred cows. You’ve got this, helper!",
      };
  }
}

export function modeStory(mode: CountMode): string {
  return mode === "count"
    ? "Look at the pasture, count every cow, then pick the total."
    : "Dot will tell you how many cows to gather. Add them until the herd is just right.";
}

export function successStory(n: number, score: number): string {
  if (n === 0) return "An empty pasture counted — zero! Dot tips her hat.";
  if (n === 1) return "One cozy cow found. Soft moo!";
  if (n === 100) return "One hundred! The whole farm cheers.";
  if (score > 0 && score % 3 === 0) {
    return `${n} cows safe in the barn. Star ${score} sparkles for you!`;
  }
  return `${n} cows counted. The herd is happier already.`;
}

export function finishStory(levelTitle: string, stars: number): StoryBeat {
  return {
    title: "Herd hero!",
    line: `You helped Farmer Dot finish ${levelTitle}. ${stars} bright star${stars === 1 ? "" : "s"} glow over the barn.`,
    spoken: `Herd hero! You helped Farmer Dot finish ${levelTitle}. You earned ${stars} star${stars === 1 ? "" : "s"}.`,
  };
}
