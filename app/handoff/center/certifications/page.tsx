import Link from "next/link";
import { CertificationMedalGallery } from "@/components/handoff/CertificationMedals";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { listUserCertifications } from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export default async function HandoffCertificationsPage() {
  await ensureSchema();
  const session = await getSession();
  if (!session) return null;

  const certifications = await listUserCertifications(session.user.id);

  return (
    <div className="handoff-panel handoff-panel--wide">
      <header className="handoff-panel__header">
        <h1>Certifications</h1>
        <p>
          Interactive medals for every module you complete. Hover for shine,
          click to flip and inspect the credential.
        </p>
      </header>

      {certifications.length === 0 ? (
        <div className="handoff-empty">
          <p>No certifications yet. Complete a module test to earn your first medal.</p>
          <Link href="/center" className="btn btn--primary handoff-btn">
            Browse modules
          </Link>
        </div>
      ) : (
        <CertificationMedalGallery
          certifications={certifications.map((cert) => ({
            id: cert.id,
            code: cert.code,
            issuedAt: cert.issuedAt,
            moduleTitle: cert.moduleTitle,
            moduleSlug: cert.moduleSlug,
            moduleKind: cert.moduleKind,
          }))}
        />
      )}
    </div>
  );
}
