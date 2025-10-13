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

  for (const line of lines) {
    const trimmed = line.trim();

    // image (markdown): ![alt](path)
    if (/^!\[[^\]]*\]\([^\)]+\)\s*$/.test(trimmed)) {
      flushList();
      const match = trimmed.match(/^!\[[^\]]*\]\(([^\)]+)\)/);
      const src = match?.[1];
      if (src) {
        blocks.push({ module: "image", imageSrc: src });
      }
      continue;
    }

    // image (html): <img src="...">
    if (/^<img\s+[^>]*src=["'][^"']+["'][^>]*>\s*$/i.test(trimmed)) {
      flushList();
      const m = trimmed.match(/src=["']([^"']+)["']/i);
      const src = m?.[1];
      if (src) blocks.push({ module: "image", imageSrc: src });
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


