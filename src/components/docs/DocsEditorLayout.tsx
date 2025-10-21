"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import type { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsEditorToolbar } from "@/components/docs/DocsEditorToolbar";

type BlockWithId = DocsBlock & { id: string };

export function DocsEditorLayout({ initialBlocks, onSave, containerStyle, allowAdd = true }: { initialBlocks?: DocsBlock[]; onSave?: (blocks: DocsBlock[]) => void; containerStyle?: CSSProperties; allowAdd?: boolean }) {
  const seed: DocsBlock[] = initialBlocks && initialBlocks.length > 0
    ? initialBlocks
    : [
        { module: "headline_1", content: "시작하기" },
        { module: "docs_1", content: "" },
      ];
  const [blocks, setBlocks] = useState<BlockWithId[]>(
    seed.map((b, i) => ({ id: `init-${i}-${Math.random().toString(36).slice(2, 7)}`, ...b }))
  );
  const refs = useRef<Array<HTMLInputElement | null>>([]).current;

  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks.map((b) => ({ id: crypto.randomUUID(), ...b })));
    }
  }, [initialBlocks]);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...blocks];
    copy[index] = { ...copy[index], ...updated } as BlockWithId;
    setBlocks(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...blocks];
    const blockToInsert: BlockWithId = { id: crypto.randomUUID(), ...(newBlock ?? { module: "docs_1", content: "" }) } as BlockWithId;
    copy.splice(index + 1, 0, blockToInsert);
    setBlocks(copy);
    // 다음 틱에 새 블록으로 focus 이동
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockToInsert.id}']`);
      el?.focus();
    });
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length === 0) return;
    const copy = [...blocks];
    const focusTargetId = index > 0 ? copy[index - 1]?.id : copy[index + 1]?.id;
    copy.splice(index, 1);
    setBlocks(copy);
    requestAnimationFrame(() => {
      if (!focusTargetId) return;
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
      el?.focus();
    });
  };

  const handleSave = () => {
    onSave?.(blocks.map(({ id, ...rest }) => rest));
  };

  const baseStyle: CSSProperties = { padding: "40px 80px", maxWidth: "800px", margin: "0 auto" };
  return (
    <div style={{ ...baseStyle, ...(containerStyle ?? {}) }}>
      <DocsEditorToolbar onSave={handleSave} onAddBlock={allowAdd ? () => handleAddBlock(blocks.length - 1) : undefined} />
      {blocks.map((block, i) => (
        <DocsBlockEditor
          key={block.id}
          index={i}
          block={block}
          onChange={handleBlockChange}
          onAddBlock={allowAdd ? handleAddBlock : () => {}}
          onRemoveBlock={handleRemoveBlock}
          onFocusMove={(idx, dir) => {
            const target = dir === "up" ? idx - 1 : idx + 1;
            const targetId = blocks[target]?.id;
            if (!targetId) return;
            requestAnimationFrame(() => {
              const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
              el?.focus();
            });
          }}
        />
      ))}
    </div>
  );
}


