import Link from "next/link";

export function ModuleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="handoff-prose">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines[0]?.startsWith("## ")) {
          return (
            <div key={index}>
              <h3>{lines[0].replace(/^##\s+/, "")}</h3>
              {lines.slice(1).map((line, lineIndex) => renderLine(line, `${index}-${lineIndex}`))}
            </div>
          );
        }

        if (lines.every((line) => line.startsWith("- ") || line.match(/^\d+\.\s/))) {
          const ordered = lines[0]?.match(/^\d+\.\s/);
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.replace(/^(-|\d+\.)\s+/, "")}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderLine(line: string, key: string) {
  if (!line.trim()) return null;
  if (line.startsWith("- ") || line.match(/^\d+\.\s/)) {
    return (
      <p key={key} className="handoff-prose__bullet">
        {line.replace(/^(-|\d+\.)\s+/, "• ")}
      </p>
    );
  }
  return <p key={key}>{line}</p>;
}

export function ModuleKindLabel({ kind }: { kind: string }) {
  return <span className="handoff-kind">{kind}</span>;
}

export function ModuleList({
  modules,
}: {
  modules: Array<{
    slug: string;
    title: string;
    summary: string;
    kind: string;
    durationMinutes: number;
    progressStatus: string;
    certified: boolean;
  }>;
}) {
  return (
    <div className="handoff-module-list">
      {modules.map((mod) => (
        <Link key={mod.slug} href={`/center/modules/${mod.slug}`} className="handoff-module-row">
          <div>
            <div className="handoff-module-row__meta">
              <ModuleKindLabel kind={mod.kind} />
              <span>{mod.durationMinutes} min</span>
            </div>
            <h2>{mod.title}</h2>
            <p>{mod.summary}</p>
          </div>
          <div className="handoff-module-row__status">
            {mod.certified ? (
              <span className="handoff-status handoff-status--certified">
                <span className="ho-medal-mini" aria-hidden />
                Certified
              </span>
            ) : mod.progressStatus === "completed" ? (
              <span className="handoff-status handoff-status--ready">Ready for test</span>
            ) : mod.progressStatus === "in_progress" ? (
              <span className="handoff-status">In progress</span>
            ) : (
              <span className="handoff-status">Start</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
