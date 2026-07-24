import Link from "next/link";
import type { ReactNode } from "react";
import {
  normalizeTrainingCategory,
  trainingCategoryLabel,
  type TrainingCategory,
} from "@/lib/handoff/types";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function ModuleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="handoff-prose">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines[0]?.startsWith("## ")) {
          return (
            <div key={index}>
              <h3>{renderInline(lines[0].replace(/^##\s+/, ""))}</h3>
              {lines.slice(1).map((line, lineIndex) =>
                renderLine(line, `${index}-${lineIndex}`),
              )}
            </div>
          );
        }

        if (lines.every((line) => line.startsWith("- ") || line.match(/^\d+\.\s/))) {
          const ordered = lines[0]?.match(/^\d+\.\s/);
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderInline(line.replace(/^(-|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line)}
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
        {renderInline(line.replace(/^(-|\d+\.)\s+/, "• "))}
      </p>
    );
  }
  return <p key={key}>{renderInline(line)}</p>;
}

export function ModuleKindLabel({ kind }: { kind: string }) {
  return <span className="handoff-kind">{kind}</span>;
}

type ModuleListItem = {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  category?: string;
  durationMinutes: number;
  progressStatus: string;
  certified: boolean;
};

const CATEGORY_ORDER: TrainingCategory[] = ["laser_scanner", "drone", "general"];

export function ModuleList({ modules }: { modules: ModuleListItem[] }) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: trainingCategoryLabel(category),
    modules: modules.filter(
      (mod) => normalizeTrainingCategory(mod.category) === category,
    ),
  })).filter((group) => group.modules.length > 0);

  return (
    <div className="handoff-module-groups">
      {grouped.map((group) => (
        <section key={group.category} className="handoff-module-group">
          <header className="handoff-module-group__header">
            <h2>{group.label}</h2>
            <span>{group.modules.length}</span>
          </header>
          <div className="handoff-module-list">
            {group.modules.map((mod) => (
              <Link
                key={mod.slug}
                href={`/center/modules/${mod.slug}`}
                className="handoff-module-row"
              >
                <div>
                  <div className="handoff-module-row__meta">
                    <ModuleKindLabel kind={mod.kind} />
                    <span>{mod.durationMinutes} min</span>
                  </div>
                  <h3>{mod.title}</h3>
                  <p>{mod.summary}</p>
                </div>
                <div className="handoff-module-row__status">
                  {mod.certified ? (
                    <span className="handoff-status handoff-status--certified">
                      <span className="ho-medal-mini" aria-hidden />
                      Certified
                    </span>
                  ) : mod.progressStatus === "completed" ? (
                    <span className="handoff-status handoff-status--ready">
                      Ready for test
                    </span>
                  ) : mod.progressStatus === "in_progress" ? (
                    <span className="handoff-status">In progress</span>
                  ) : (
                    <span className="handoff-status">Start</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
