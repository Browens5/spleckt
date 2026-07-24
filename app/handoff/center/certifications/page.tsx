import Link from "next/link";
import { ModuleKindLabel } from "@/components/handoff/ModuleViews";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { listUserCertifications } from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export default async function HandoffCertificationsPage() {
  await ensureSchema();
  const session = await getSession();
  if (!session) return null;

  const certifications = await listUserCertifications(session.user.id);

  return (
    <div className="handoff-panel">
      <header className="handoff-panel__header">
        <h1>Certified passes</h1>
        <p>
          Proof you can hand the skill forward — earned by finishing module
          certification tests.
        </p>
      </header>

      {certifications.length === 0 ? (
        <div className="handoff-empty">
          <p>No certifications yet. Finish a module test to lock in your first clean pass.</p>
          <Link href="/center" className="btn btn--primary handoff-btn">
            Browse modules
          </Link>
        </div>
      ) : (
        <div className="handoff-cert-list">
          {certifications.map((cert) => (
            <article key={cert.id} className="handoff-cert">
              <div className="handoff-module-row__meta">
                <ModuleKindLabel kind={cert.moduleKind} />
                <time dateTime={new Date(cert.issuedAt).toISOString()}>
                  Issued{" "}
                  {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <h2>{cert.moduleTitle}</h2>
              <p className="handoff-cert-code">
                <code>{cert.code}</code>
              </p>
              <Link href={`/center/modules/${cert.moduleSlug}`}>View module</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
