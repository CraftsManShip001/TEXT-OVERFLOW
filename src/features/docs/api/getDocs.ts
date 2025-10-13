import { mockDocs, type DocSummary } from "@/mocks/docs";

export async function getDocs({ sort }: { sort: "trending" | "latest" }): Promise<DocSummary[]> {
  const data = [...mockDocs];
  if (sort === "trending") {
    data.sort((a, b) => b.stats.likes - a.stats.likes);
  } else {
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return data;
}


