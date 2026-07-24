import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificationTest } from "@/components/handoff/TrainingInteractive";
import { ensureSchema } from "@/lib/db/ensure-schema";
import {
  getModuleBySlug,
  getPublicTestPayload,
  getTestForModule,
} from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export default async function HandoffModuleTestPage({
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

  const test = await getTestForModule(mod.id);
  if (!test) notFound();

  const publicTest = getPublicTestPayload(test);

  return (
    <div className="handoff-panel">
      <Link href={`/center/modules/${mod.slug}`} className="handoff-back">
        ← Back to module
      </Link>
      <CertificationTest
        testId={publicTest.id}
        title={publicTest.title}
        passingScore={publicTest.passingScore}
        questions={publicTest.questions}
        moduleSlug={mod.slug}
      />
    </div>
  );
}
