import { Tabs } from "@/components/ui/tabs/Tabs";
import { DocCard } from "@/components/ui/card/DocCard";
import { TopNav } from "@/components/layout/TopNav";
import { headers } from "next/headers";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = sp?.tab === "latest" ? "latest" : "trending";
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const res = await fetch(`${base}/api/docs`, { cache: "no-store" });
  const { docs } = await res.json();

  return (
    <div style={{ backgroundColor: "white" }  }>
      <TopNav />
      <div style={{ paddingBottom: 24, paddingTop: 0, paddingLeft: 40, paddingRight: 40, backgroundColor: "white" }}>
        <Tabs active={tab} />
        <section
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {docs?.map((d: any) => (
            <a key={d.id} href={`/docs/${d.slug}`}>
              <DocCard doc={{ id: d.id, title: d.title, author: d.profiles?.username, description: "", cover: d.cover_url }} />
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}
