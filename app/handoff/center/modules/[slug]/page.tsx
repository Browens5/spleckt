import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleKindLabel } from "@/components/handoff/ModuleViews";
import { ModuleTraining } from "@/components/handoff/ModuleTraining";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { parseInteractiveLesson } from "@/lib/handoff/interactive";
import {
  getCertificationMap,
  getModuleBySlug,
  getProgressMap,
  startModuleProgress,
} from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export default async function HandoffModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSchema();
  const session = await getSession();
  if (!session) return null;

  const { slug } = await params;
  const mod = await getModuleBySlug(slug);
  if (!mod) notFound();

  await startModuleProgress(session.user.id, mod.id);

  const [progressMap, certMap] = await Promise.all([
    getProgressMap(session.user.id),
    getCertificationMap(session.user.id),
  ]);
  const progress = progressMap.get(mod.id);
  const certified = certMap.has(mod.id);
  const lesson = parseInteractiveLesson(mod.body);

  return (
    <div className={`handoff-panel${lesson ? " handoff-panel--wide" : ""}`}>
      <Link href="/center" className="handoff-back">
        ← All modules
      </Link>

      <header className="handoff-panel__header">
        <div className="handoff-module-row__meta">
          <ModuleKindLabel kind={mod.kind} />
          <span>{mod.durationMinutes} min</span>
        </div>
        <h1>{mod.title}</h1>
        <p>{mod.summary}</p>
      </header>

      <ModuleTraining
        slug={mod.slug}
        body={mod.body}
        lesson={lesson}
        completed={progress?.status === "completed" || certified}
        certified={certified}
      />
    </div>
  );
}
