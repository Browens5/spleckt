"use client";

import { useRouter } from "next/navigation";
import { InteractiveLessonPlayer } from "@/components/handoff/InteractiveLesson";
import { ModuleBody } from "@/components/handoff/ModuleViews";
import { ModuleActions } from "@/components/handoff/TrainingInteractive";
import type { InteractiveLesson } from "@/lib/handoff/interactive";

export function ModuleTraining({
  slug,
  body,
  lesson,
  completed,
  certified,
}: {
  slug: string;
  body: string;
  lesson: InteractiveLesson | null;
  completed: boolean;
  certified: boolean;
}) {
  const router = useRouter();

  async function markComplete() {
    const res = await fetch(`/api/handoff/modules/${slug}/complete`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("Unable to update progress");
    }
    router.refresh();
  }

  if (lesson) {
    return (
      <InteractiveLessonPlayer
        lesson={lesson}
        slug={slug}
        completed={completed}
        certified={certified}
        onMarkComplete={markComplete}
      />
    );
  }

  return (
    <>
      <ModuleBody body={body} />
      <ModuleActions slug={slug} completed={completed} certified={certified} />
    </>
  );
}
