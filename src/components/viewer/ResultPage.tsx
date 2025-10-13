"use client";

import { useEffect, useState } from "react";
import { DocsBlockRender } from "@/components/docs/DocsBlockRender";
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
  const start = data.sections[active]?.start ?? 0;
  const end = data.sections[active]?.end ?? data.blocks.length;
  const currentSlice = data.blocks.slice(start, end);
  
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
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px 24px 0 24px", flex: "0 0 auto" }}>
            <DocsHeader title={data.sections[active]?.title ?? data.title} breadcrumb={["문서 뷰어"]} />
          </div>
          <div style={{ padding: "0 24px 24px 24px", overflowY: "auto", minHeight: 0 }}>
            <DocsBlockRender blocks={withImages} />
          </div>
        </div>
      </div>
    </div>
  );
}


