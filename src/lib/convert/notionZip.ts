import JSZip from "jszip";
import { convertMarkdown } from "./markdown";
import { DocsBlock } from "@/types/docs";

export interface NotionZipParseResult {
  title: string;
  blocks: DocsBlock[];
  files: Record<string, Uint8Array>; 
  sections: { title: string; anchor: string; start: number; end: number }[];
}

export interface ConvertOptions {
  mode?: "single" | "merge"; 
  preferTitlePattern?: RegExp;
}
export async function convertNotionZipToBlocks(
  input: Blob | ArrayBuffer,
  options: ConvertOptions = {}
): Promise<NotionZipParseResult> {
  const { mode = "merge", preferTitlePattern = /기능\s*설명/i } = options;
  const buffer = input instanceof Blob ? await input.arrayBuffer() : input;
  const rootZip = await JSZip.loadAsync(buffer);

  // helper: pick a zip that actually contains markdown files; supports one level nesting
  async function findZipWithMarkdown(z: JSZip): Promise<{ zip: JSZip; mdPaths: string[] }> {
    const allPaths = Object.keys(z.files);
    const filePaths = allPaths.filter((p) => !z.files[p].dir);
    const mdPaths = filePaths.filter((p) => /\.(md|markdown)$/i.test((p.split("/").pop() || p).trim()));
    if (mdPaths.length > 0) return { zip: z, mdPaths };

    const nestedZipPaths = filePaths.filter((p) => /\.zip$/i.test(p));
    for (const p of nestedZipPaths) {
      try {
        const buf = await z.file(p)!.async("arraybuffer");
        const nested = await JSZip.loadAsync(buf);
        const found = await findZipWithMarkdown(nested);
        if (found.mdPaths.length > 0) return found;
      } catch {
        // ignore and continue
      }
    }
    return { zip: z, mdPaths: [] };
  }

  const { zip, mdPaths } = await findZipWithMarkdown(rootZip);

  if (mdPaths.length === 0) {
    if (typeof window !== "undefined") {
      console.warn("[convertNotionZipToBlocks] markdown files not found", {
        entries: Object.keys(rootZip.files).slice(0, 20),
      });
    }
    return { title: "Untitled", blocks: [], files: {}, sections: [] };
  }

  const score = (name: string) => {
    const base = 0;
    const n = name.toLowerCase();
    let s = base;
    if (preferTitlePattern.test(name)) s -= 20;
    if (/(^|\b)untitled(\b|$)/i.test(name)) s += 20;
    return s;
  };

  const sorted = [...mdPaths].sort((a, b) => {
    const aName = a.split("/").pop() || a;
    const bName = b.split("/").pop() || b;
    const sa = score(aName);
    const sb = score(bName);
    if (sa !== sb) return sa - sb;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

  let title = (sorted[0].split("/").pop() || sorted[0]).replace(/\.(md|markdown)$/i, "");
  let blocks: DocsBlock[] = [];
  const sections: { title: string; anchor: string; start: number; end: number }[] = [];

  const slug = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9\u3131-\uD79D]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sanitize = (name: string) => {
    let n = name;
    try { n = decodeURIComponent(n); } catch {}
    // drop trailing hex/hash ids from Notion export filenames
    n = n.replace(/\s[0-9a-f]{8,}$/i, "");
    return n.trim();
  };

  if (mode === "single") {
    const mdText = await zip.file(sorted[0])!.async("string");
    let part = convertMarkdown(mdText);
    if (part[0]?.module === "headline_1") {
      const hTitle = String(part[0].content || "");
      if (hTitle) title = sanitize(hTitle);
      if (part[1]?.module === "space") part = part.slice(2);
      else part = part.slice(1);
    }
    if (part.length > 0) {
      sections.push({ title, anchor: slug(title), start: 0, end: part.length });
      blocks = part;
    } else {
      blocks = [];
    }
  } else {
    for (let i = 0; i < sorted.length; i++) {
      const path = sorted[i];
      const rawName = (path.split("/").pop() || path).replace(/\.(md|markdown)$/i, "");
      const name = sanitize(rawName);
      const mdText = await zip.file(path)!.async("string");
      let part = convertMarkdown(mdText);
      if (part.length === 0 && mdText.trim().length > 0) {
        part = [{ module: "docs_1", content: mdText } as DocsBlock];
      }
      let sectionTitle = name;
      if (part[0]?.module === "headline_1") {
        const hTitle = String(part[0].content || "");
        if (hTitle) sectionTitle = sanitize(hTitle);
        if (part[1]?.module === "space") part = part.slice(2);
        else part = part.slice(1);
      }
      if (part.length === 0) {
        if (i === 0 && sectionTitle) title = sectionTitle;
        continue;
      }
      const start = blocks.length;
      blocks.push(...part);
      const end = blocks.length;
      if (i === 0 && sectionTitle) title = sectionTitle;
      sections.push({ title: sectionTitle, anchor: slug(sectionTitle), start, end });
    }
  }

  const files: Record<string, Uint8Array> = {};
  await Promise.all(
    Object.entries(zip.files).map(async ([path, entry]) => {
      if (entry.dir) return;
      if (/\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i.test(path)) {
        files[path] = new Uint8Array(await entry.async("arraybuffer"));
      }
    })
  );

  return { title, blocks, files, sections };
}


