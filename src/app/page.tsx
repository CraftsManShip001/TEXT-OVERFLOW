import { getDocs } from "@/features/docs/api/getDocs";
import { Tabs } from "@/components/ui/tabs/Tabs";
import { DocCard } from "@/components/ui/card/DocCard";
import { TopNav } from "@/components/layout/TopNav";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = sp?.tab === "latest" ? "latest" : "trending";
  const docs = await getDocs({ sort: tab });

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
          {docs.map((d) => (
            <DocCard key={d.id} doc={d} />
          ))}
        </section>
      </div>
    </div>
  );
}
