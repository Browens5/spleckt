import { ModuleList } from "@/components/handoff/ModuleViews";
import { ensureSchema } from "@/lib/db/ensure-schema";
import {
  getCertificationMap,
  getProgressMap,
  listPublishedModules,
} from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export default async function HandoffCenterPage() {
  await ensureSchema();
  const session = await getSession();
  if (!session) return null;

  const [modules, progressMap, certMap] = await Promise.all([
    listPublishedModules(),
    getProgressMap(session.user.id),
    getCertificationMap(session.user.id),
  ]);

  return (
    <div className="handoff-panel">
      <header className="handoff-panel__header">
        <h1>Training modules</h1>
        <p>
          Work through each module, pass its test, and earn a certification for
          the tool, software, or technique you learned.
        </p>
      </header>

      <ModuleList
        modules={modules.map((mod) => ({
          slug: mod.slug,
          title: mod.title,
          summary: mod.summary,
          kind: mod.kind,
          durationMinutes: mod.durationMinutes,
          progressStatus: progressMap.get(mod.id)?.status ?? "not_started",
          certified: certMap.has(mod.id),
        }))}
      />
    </div>
  );
}
