"use client";

import { useState, useEffect } from "react";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";

interface DocsBlockEditorProps {
  block: DocsBlockType;
  index: number;
  onChange: (index: number, updated: DocsBlockType) => void;
  onAddBlock: (index: number, newBlock?: DocsBlockType) => void;
  onRemoveBlock?: (index: number) => void;
  onFocusMove?: (index: number, direction: "up" | "down") => void;
  registerRef?: (index: number, el: HTMLInputElement | null) => void;
}

export function DocsBlockEditor({ block, index, onChange, onAddBlock, onRemoveBlock, onFocusMove, registerRef }: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setValue(block.content ?? "");
  }, [block.content]);

  const detectModuleType = (text: string): DocsBlockType["module"] => {
    if (/^##\s/.test(text)) return "headline_2";
    if (/^#\s/.test(text)) return "headline_1";
    if (/^[-*]\s/.test(text)) return "list";
    return "docs_1";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const nextModule = block.module !== "docs_1" ? (text.trim() === "" ? "docs_1" : block.module) : detectModuleType(text);
    const cleaned =
      nextModule === "headline_2" ? text.replace(/^##\s*/, "") :
      nextModule === "headline_1" ? text.replace(/^#\s*/, "") :
      nextModule === "list" ? text.replace(/^[-*]\s*/, "") :
      text;
    setValue(cleaned);
    onChange(index, { ...block, module: nextModule, content: cleaned });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const composing = (e.nativeEvent as any)?.isComposing || (e as any).keyCode === 229;
    if (composing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      onAddBlock(index, { module: "docs_1", content: ""});
      return;
    }
    if ((e.key === "Backspace" || e.key === "Delete") && value === "") {
      e.preventDefault();
      onRemoveBlock?.(index);
      return;
    }
    if (e.key === "ArrowUp") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      if (caret === 0) {
        e.preventDefault();
        onFocusMove?.(index, "up");
        return;
      }
    }
    if (e.key === "ArrowDown") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      const len = e.currentTarget.value.length;
      if (caret === len) {
        e.preventDefault();
        onFocusMove?.(index, "down");
        return;
      }
    }
  };

  // 미리보기 렌더링: 이미지/표/리스트 등은 실제 모양으로 표시
  if (block.module === "image") {
    const src = (block as any).imageSrc as string | undefined;
    return (
      <DocsBlock module="image">
        <img src={src} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} />
      </DocsBlock>
    );
  }

  if (block.module === "table") {
    const headers = (block as any).tableHeaders as string[] | undefined;
    const rows = (block as any).tableRows as string[][] | undefined;
    return (
      <DocsBlock module="table">
        <table>
          {headers && (
            <thead>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          {rows && (
            <tbody>
              {rows.map((r, ridx) => (
                <tr key={ridx}>
                  {r.map((c, cidx) => (
                    <td key={cidx}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </DocsBlock>
    );
  }

  if (block.module === "list") {
    const items = block.listItems ?? [];
    return (
      <DocsBlock module="list">
        <ul>
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </DocsBlock>
    );
  }

  return (
    <DocsBlock module={block.module}>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        ref={(el) => registerRef?.(index, el)}
        data-block-id={(block as any).id}
        placeholder={focused ? "내용을 입력하세요" : ""}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          font: "inherit",
          color: "inherit",
          outline: "none",
        }}
      />
    </DocsBlock>
  );
}


