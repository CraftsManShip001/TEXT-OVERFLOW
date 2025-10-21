import { TopNav } from "@/components/layout/TopNav";
import { DocsEditorLayout } from "@/components/docs/DocsEditorLayout";

export default function Page() {
  return (
    <div style={{ background: "white" }}>
      <TopNav />
      <DocsEditorLayout />
    </div>
  );
}


