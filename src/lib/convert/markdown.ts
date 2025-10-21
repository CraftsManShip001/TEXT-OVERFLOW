import { DocsBlock } from "@/types/docs";

export function convertMarkdown(content: string): DocsBlock[] {
  const blocks: DocsBlock[] = [];
  const lines = content.split(/\r?\n/);

  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ module: "list", listItems: [...currentList] });
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const normalized = trimmed.replace(/^[-*]\s+/, "").replace(/^>\s+/, "");

    const mdImg = normalized.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImg) {
      flushList();
      const raw = mdImg[1].trim();
      const src = raw.replace(/^<|>$/g, "");
      blocks.push({ module: "image", imageSrc: src });
      continue;
    }

    const htmlImg = normalized.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (htmlImg) {
      flushList();
      blocks.push({ module: "image", imageSrc: htmlImg[1] });
      continue;
    }

    if (trimmed === "::space") {
      flushList();
      blocks.push({ module: "big_space" });
      continue;
    }

    if (trimmed === "") {
      flushList();
      blocks.push({ module: "space" });
      continue;
    }

    if (/^#{1,2}\s/.test(trimmed)) {
      flushList();
      blocks.push({ module: "headline_1", content: trimmed.replace(/^#{1,2}\s*/, "").trim() });
      continue;
    }

    if (/^#{3,4}\s/.test(trimmed)) {
      flushList();
      blocks.push({ module: "headline_2", content: trimmed.replace(/^#{3,4}\s*/, "").trim() });
      continue;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const l = lines[j].trim();
        if (/^\|.*\|$/.test(l)) {
          tableLines.push(l);
          j++;
        } else {
          break;
        }
      }
      if (tableLines.length >= 2) {
        const header = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((s) => s.trim());
        const rest = tableLines.slice(1);
        const bodyLines = rest.filter((l) => !/^\|?\s*:?[-]+:?\s*(\|\s*:?[-]+:?\s*)+\|?$/.test(l));
        const rows = bodyLines.map((r) => r.slice(1, -1).split("|").map((s) => s.trim()));
        flushList();
        blocks.push({ module: "table", tableHeaders: header, tableRows: rows } as any);
        i = j - 1;
        continue;
      }
    }

    if (/^[-*]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    flushList();
    blocks.push({ module: "docs_1", content: trimmed });
  }

  flushList();
  return blocks;
}


