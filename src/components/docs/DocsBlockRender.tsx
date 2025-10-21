"use client";

import { DocsBlock } from "./DocsBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";

interface DocsBlockRenderProps {
  blocks: DocsBlockType[];
  files?: Record<string, Uint8Array>;
}

export function DocsBlockRender({ blocks, files = {} }: DocsBlockRenderProps) { // ✅ 기본값 {} 추가
  return (
    <>
      {blocks.map((block, i) => {
        const { module, content, listItems } = block;

        switch (module) {
          case "headline_1":
          case "headline_2":
            return (
              <div id={typeof content === "string" ? content : undefined} key={i}>
                <DocsBlock module={module}>{content}</DocsBlock>
              </div>
            );

          case "image": {
            const src = (block as any).imageSrc;
            let blobUrl = src;
            const match = Object.keys(files).find((p) => p.endsWith(src));
            if (match) {
              const u8 = files[match];
              const ab = (u8.buffer as ArrayBuffer).slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
              const blob = new Blob([ab], { type: "image/png" });
              blobUrl = URL.createObjectURL(blob);
            }

            return (
              <DocsBlock key={i} module="image">
                <img
                  src={blobUrl}
                  alt=""
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
              </DocsBlock>
            );
          }

          case "docs_1":
            return (
              <DocsBlock key={i} module={module}>
                {content}
              </DocsBlock>
            );

          case "table": {
            const headers = (block as any).tableHeaders as string[] | undefined;
            const rows = (block as any).tableRows as string[][] | undefined;
            return (
              <DocsBlock key={i} module="table">
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

          case "list":
            return (
              <DocsBlock key={i} module="list">
                <ul>
                  {listItems?.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </DocsBlock>
            );

          case "space":
          case "big_space":
            return <DocsBlock key={i} module={module} />;

          default:
            return null;
        }
      })}
    </>
  );
}
