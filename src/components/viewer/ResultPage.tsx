"use client";

import { useEffect, useState } from "react";
import { DocsBlockRender } from "@/components/docs/DocsBlockRender";
import { DocsEditorLayout } from "@/components/docs/DocsEditorLayout";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import type { DocsBlock as DocsBlockType } from "@/types/docs";
import { TopNav } from "@/components/layout/TopNav";
import { DocsHeader } from "@/components/docs/DocsHeader";

export function ResultPage() {
  const [data, setData] = useState<{ title: string; sections: { title: string; anchor: string; start: number; end: number }[]; blocks: DocsBlockType[] } | null>(null);
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("__render_blocks__");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  if (!data) return null;

  // 헤더 중복 방지: 섹션 앞 big_space, 첫 headline_1 및 그 다음 space 제거
  const hasSections = Array.isArray(data.sections) && data.sections.length > 0;
  const start = hasSections ? (data.sections[active]?.start ?? 0) : 0;
  const end = hasSections ? (data.sections[active]?.end ?? data.blocks.length) : data.blocks.length;
  const currentSlice = (() => {
    const sliced = data.blocks.slice(start, end);
    return sliced.length > 0 ? sliced : data.blocks; // 비면 전체 문서로 폴백
  })();
  
  // 이미지 경로 치환: sessionStorage에 저장된 files를 Blob URL로 매핑
  let fileMap: Record<string, string> = {};
  try {
    const raw = sessionStorage.getItem("__render_files__");
    if (raw) fileMap = JSON.parse(raw);
  } catch {}
  const baseDir = (() => {
    try {
      const blocksState = JSON.parse(sessionStorage.getItem("__render_blocks__") || "null");
      if (!blocksState?.title) return "";
      // Notion export 형식: "제목 .../assets/파일" 또는 "제목 .../파일"
      return "";
    } catch { return ""; }
  })();

  const withImages = currentSlice.map((b) => {
    if ((b as any).imageSrc) {
      let src = (b as any).imageSrc as string;
      const decoded = decodeURIComponent(src);
      const base = (src.split("/").pop() || src);
      const baseDecoded = decodeURIComponent(base);
      // Notion export에서 상대경로로 오는 경우 assets/ 접두 제거
      if (src.startsWith("./")) src = src.slice(2);
      if (src.startsWith("assets/")) src = src.replace(/^assets\//, "");
      const url =
        fileMap[src] ||
        fileMap[decoded] ||
        fileMap[src.replace(/^\.[\/]/, "")] ||
        fileMap[decoded.replace(/^\.[\/]/, "")] ||
        fileMap[base] ||
        fileMap[baseDecoded] ||
        fileMap[base.toLowerCase()] ||
        fileMap[baseDecoded.toLowerCase()];
      if (url) return { ...b, imageSrc: url } as any;
    }
    return b;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopNav />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", width: "100%", flex: 1, minHeight: 0 }}>
        <nav style={{ padding: "24px 16px", overflowY: "auto" }}>
          {data.sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: 6 }} onClick={() => setActive(i)}>
              <SidebarItem label={sec.title} module="default" active={i === active} />
            </div>
          ))}
        </nav>
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ padding: "24px 24px 0 24px", flex: "0 0 auto" }}>
            <DocsHeader title={data.sections[active]?.title ?? data.title} breadcrumb={[data.title]} />
          </div>
          <div style={{ padding: "0 24px 24px 24px", overflowY: "auto", minHeight: 0, minWidth: 0 }}>
            <DocsEditorLayout
              initialBlocks={(withImages.length > 0 ? withImages : data.blocks) as any}
              containerStyle={{ padding: 0, maxWidth: "100%" }}
              allowAdd={false}
              onSave={async (edited) => {
                // 현재 섹션 블록을 치환
                const next = [...data.blocks];
                if (hasSections) {
                  next.splice(start, end - start, ...edited);
                } else {
                  // 섹션 정보가 없으면 전체 덮어쓰기
                  next.splice(0, next.length, ...edited);
                }
                const updated = { ...data, blocks: next };
                setData(updated);
                sessionStorage.setItem("__render_blocks__", JSON.stringify(updated));

                // 서버에도 반영 (slug를 sessionStorage에 저장한 케이스 가정)
                try {
                  const metaRaw = sessionStorage.getItem("__render_meta__");
                  const slug = metaRaw ? JSON.parse(metaRaw)?.slug : undefined;
                  if (slug) {
                    await fetch(`/api/docs/${slug}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sections: updated.sections, blocks: updated.blocks }),
                    });
                  }
                } catch {}
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


