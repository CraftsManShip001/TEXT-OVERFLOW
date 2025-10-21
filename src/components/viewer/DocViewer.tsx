"use client";

import { useState, useMemo } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockRender } from "@/components/docs/DocsBlockRender";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";

type Section = { title: string; blocks: any[] };

type TocNode = { label: string; anchor?: string; children?: TocNode[] };

export function DocViewer({ title, sections, breadcrumb, toc }: { title: string; sections: Section[]; breadcrumb: string; toc?: TocNode[] }) {
  const [active, setActive] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
  const currentSection = sections?.[active];
  const current = currentSection?.blocks ?? [];

  const navItems: TocNode[] = useMemo(
    () => (toc && toc.length > 0 ? toc : sections.map((s) => ({ label: s.title, anchor: s.title } as TocNode))),
    [toc, sections]
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - 64px)" }}>
      <nav style={{ padding: "24px 16px", overflowY: "auto" }}>
        {navItems.map((node, idx) => {
          const hasChildren = !!(node.children && node.children.length > 0);
          const isOpen = openGroups[idx] ?? true; // 기본 열림
          if (hasChildren) {
            return (
              <div key={idx} style={{ marginBottom: 8 }}>
                <div onClick={() => setOpenGroups(prev => ({ ...prev, [idx]: !isOpen }))}>
                  <SidebarItem label={node.label} module="collapse" />
                </div>
                {isOpen && (
                  <div style={{ marginLeft: 8 }}>
                    {node.children!.map((c, j) => (
                      <div key={`${idx}-${j}`} style={{ marginBottom: 6 }} onClick={() => {
                        const target = sections.findIndex(s => s.title === c.label);
                        if (target >= 0) setActive(target);
                      }}>
                        <SidebarItem label={c.label} module="small" active={sections[active]?.title === c.label} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={idx} style={{ marginBottom: 6 }} onClick={() => {
              const target = sections.findIndex(s => s.title === node.label);
              if (target >= 0) setActive(target);
            }}>
              <SidebarItem label={node.label} module="default" active={sections[active]?.title === node.label} />
            </div>
          );
        })}
      </nav>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "24px 24px 0 24px", flex: "0 0 auto" }}>
          <DocsHeader title={currentSection?.title || title} breadcrumb={[breadcrumb]} />
        </div>
        <div style={{ padding: "0 24px 24px 24px", overflowY: "auto", minHeight: 0 }}>
          <DocsBlockRender blocks={current} />
        </div>
      </div>
    </div>
  );
}


