"use client";

import { useMemo, useState } from "react";
import type { DocsBlock } from "@/types/docs";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import { DocsEditorToolbar } from "@/components/docs/DocsEditorToolbar";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";

type Section = { title: string; anchor: string; start: number; end: number };

export function DocsEditorSplit({
  sections,
  initialBlocks,
  onSave,
  allowAdd = true,
}: {
  sections: Section[];
  initialBlocks: DocsBlock[];
  onSave: (blocks: DocsBlock[], sections: Section[]) => void;
  allowAdd?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [workingBlocks, setWorkingBlocks] = useState<DocsBlock[]>(() => [...initialBlocks]);
  const [localSections, setLocalSections] = useState<Section[]>(() => sections.map((s) => ({ ...s })));

  const { start, end } = localSections[active] ?? { start: 0, end: 0 };
  const offset = start;
  const currentBlocks = useMemo(() => workingBlocks.slice(start, end), [workingBlocks, start, end]);

  const patchSectionsAfter = (fromIdxDelta: number) => {
    setLocalSections((prev) =>
      prev.map((s, i) => {
        if (i < active) return s;
        if (i === active) return { ...s, end: s.end + fromIdxDelta };
        return { ...s, start: s.start + fromIdxDelta, end: s.end + fromIdxDelta };
      })
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0 }}>
      <nav style={{ padding: "24px 16px", overflowY: "auto" }}>
        {localSections.map((s, i) => (
          <div key={i} style={{ marginBottom: 6 }} onClick={() => setActive(i)}>
            <SidebarItem label={s.title} module="default" active={i === active} />
          </div>
        ))}
      </nav>
      <div style={{ padding: "24px 24px", overflowY: "auto" }}>
        <DocsEditorToolbar onSave={() => onSave(workingBlocks, localSections)} onAddBlock={
          allowAdd
            ? () => {
                const insertAt = end; // 섹션 맨 뒤에 추가
                setWorkingBlocks((prev) => {
                  const copy = [...prev];
                  copy.splice(insertAt, 0, { module: "docs_1", content: "" });
                  return copy;
                });
                patchSectionsAfter(1);
              }
            : undefined
        } />

        {currentBlocks.map((block, i) => (
          <DocsBlockEditor
            key={i}
            index={i}
            block={block}
            onChange={(idx, updated) =>
              setWorkingBlocks((prev) => {
                const copy = [...prev];
                copy[offset + idx] = updated;
                return copy;
              })
            }
            onAddBlock={(idx, newBlock) => {
              const insertAt = offset + idx + 1;
              setWorkingBlocks((prev) => {
                const copy = [...prev];
                copy.splice(insertAt, 0, newBlock ?? { module: "docs_1", content: "" });
                return copy;
              });
              patchSectionsAfter(1);
            }}
            onRemoveBlock={(idx) => {
              const removeAt = offset + idx;
              setWorkingBlocks((prev) => {
                const copy = [...prev];
                copy.splice(removeAt, 1);
                return copy;
              });
              patchSectionsAfter(-1);
            }}
          />
        ))}
      </div>
    </div>
  );
}


