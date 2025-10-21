"use client";

import { useState } from "react";
import type { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsEditorToolbar } from "@/components/docs/DocsEditorToolbar";

export function DocsEditorInline({ initialBlocks, onSave }: { initialBlocks: DocsBlock[]; onSave: (blocks: DocsBlock[]) => void }) {
  const [blocks, setBlocks] = useState<DocsBlock[]>(initialBlocks);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...blocks];
    copy[index] = updated;
    setBlocks(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...blocks];
    copy.splice(index + 1, 0, newBlock ?? { module: "docs_1", content: "" });
    setBlocks(copy);
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: 800, margin: "0 auto" }}>
      <DocsEditorToolbar onSave={() => onSave(blocks)} onAddBlock={() => handleAddBlock(blocks.length - 1)} />
      {blocks.map((block, i) => (
        <DocsBlockEditor
          key={i}
          index={i}
          block={block}
          onChange={handleBlockChange}
          onAddBlock={handleAddBlock}
        />
      ))}
    </div>
  );
}


