export interface DocSummary {
  id: string;
  title: string;
  description: string;
  cover?: string;
  stats: { views: number; likes: number };
  createdAt: string; // ISO
}

export const mockDocs: DocSummary[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  title: "오프에어",
  description: "간단한 무소마 방송부 메뉴얼입니다",
  cover: undefined,
  stats: { views: 1000 - i * 17, likes: 100 - i * 3 },
  createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
}));


