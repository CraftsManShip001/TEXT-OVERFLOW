import { TopNav } from "@/components/layout/TopNav";
import { DocViewer } from "@/components/viewer/DocViewer";
import { headers } from "next/headers";

export default async function DocDetail({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const res = await fetch(`${base}/api/docs/${p.slug}`, { cache: "no-store" });
  if (!res.ok) return <div>문서를 찾을 수 없습니다.</div> as any;
  const { doc, sections, toc } = await res.json();

  return (
    <div style={{ background: "white" }}>
      <TopNav />
      <DocViewer title={doc.title} sections={sections} breadcrumb={doc.slug} toc={toc} />
    </div>
  );
}


