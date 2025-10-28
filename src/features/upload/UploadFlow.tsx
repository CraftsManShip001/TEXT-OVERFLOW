"use client";

import styled from "@emotion/styled";
import { useRef, useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { applyTypography } from "@/lib/themeHelper";
import { convertNotionZipToBlocks } from "@/lib/convert/notionZip";
import { DocsBlockRender } from "@/components/docs/DocsBlockRender";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsEditorToolbar } from "@/components/docs/DocsEditorToolbar";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import { useRouter } from "next/navigation";
import type { DocsBlock as DocsBlockType } from "@/types/docs";
import { useUser } from "@supabase/auth-helpers-react";
import { DocsSidebar } from "@/components/layout/DocsSidebar";

type Step = "guide" | "progress" | "nick" | "title" | "desc" | "edit" | "confirm" | "render";

export function UploadFlow() {
  const router = useRouter();
  const user = useUser();
  const [step, setStep] = useState<Step>("guide");
  const [nick, setNick] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [renderTitle, setRenderTitle] = useState("");
  const [blocks, setBlocks] = useState<DocsBlockType[]>([]);
  const [sections, setSections] = useState<{ title: string; anchor: string }[]>([]);
  const [rendering, setRendering] = useState(false);
  type BlockWithId = DocsBlockType & { id: string };
  const [editBlocks, setEditBlocks] = useState<BlockWithId[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  // 편집 단계 진입 시, 아직 로드하지 않았다면 ZIP을 파싱하여 블록을 채움
  useEffect(() => {
    const bootEdit = async () => {
      if (!file) return;
      try {
        setRendering(true);
        const { title: t, blocks: b, sections: s, files } = await convertNotionZipToBlocks(file, { mode: "merge" });
        setRenderTitle(title || t);
        setSections(s);
        // 미리보기/편집용: 파일 바이트로 Blob URL 생성하여 이미지 경로 치환
        const urlMap: Record<string, string> = {};
        const allKeys: string[] = [];
        const folderIndex: Record<string, string[]> = {};
        if (files) {
          for (const [path, bytes] of Object.entries(files)) {
            try {
              const u8 = bytes as unknown as Uint8Array;
              const blob = new Blob([new Uint8Array(u8)]);
              const url = URL.createObjectURL(blob);
              const filename = path.split("/").pop() || path;
              urlMap[path] = url;
              urlMap[decodeURIComponent(path)] = url;
              urlMap[filename] = url;
              urlMap[decodeURIComponent(filename)] = url;
              allKeys.push(path, decodeURIComponent(path), filename, decodeURIComponent(filename));
              const folder = (decodeURIComponent(path).includes("/") ? decodeURIComponent(path).slice(0, decodeURIComponent(path).lastIndexOf("/")) : "");
              if (folder) {
                folderIndex[folder] = folderIndex[folder] || [];
                folderIndex[folder].push(url);
              }
            } catch {}
          }
        }
        const resolveUrl = (src: string): string | undefined => {
          if (!src) return undefined;
          const decoded = decodeURIComponent(src);
          const stripDot = src.replace(/^\.\//, "");
          const stripAssets = stripDot.replace(/^assets\//i, "");
          const base = src.split("/").pop() || src;
          const baseDecoded = decodeURIComponent(base);
          const direct = urlMap[src] || urlMap[decoded] || urlMap[stripDot] || urlMap[stripAssets] || urlMap[base] || urlMap[baseDecoded];
          if (direct) return direct;
          // 폴더/경로가 달라서 직접 매핑이 안될 경우: suffix 매칭으로 보정
          const candidates = [decoded, stripDot, stripAssets, base, baseDecoded];
          for (const key of allKeys) {
            const k = key;
            const kd = decodeURIComponent(k);
            if (candidates.some((c) => k.endsWith(c) || kd.endsWith(c))) {
              return urlMap[key] ?? urlMap[kd];
            }
          }
          // 폴더 일치 + 확장자 일치로 1개 선택 (노션이 파일명을 해시로 바꾼 케이스)
          const folder = decoded.includes("/") ? decoded.slice(0, decoded.lastIndexOf("/")) : "";
          const ext = (baseDecoded.split(".").pop() || "").toLowerCase();
          if (folder && ext) {
            const candidateKey = allKeys.find((k) => {
              const kd2 = decodeURIComponent(k);
              return (kd2.includes(folder + "/") || k.includes(folder + "/")) && kd2.toLowerCase().endsWith("." + ext);
            });
            if (candidateKey) return urlMap[candidateKey];
            // 폴더 내 첫 번째 같은 확장자 이미지로 폴백
            const list = folderIndex[folder];
            if (list && list.length > 0) {
              const hit = list.find((u) => u.toLowerCase().includes("." + ext)) || list[0];
              if (hit) return hit;
            }
          }
          return undefined;
        };
        const replaced = (b as any[]).map((blk) => {
          if (blk.module === "image" && blk.imageSrc) {
            const u = resolveUrl(blk.imageSrc);
            if (u) return { ...blk, imageSrc: u };
          }
          return blk;
        });
        setBlocks(replaced as any);
      } catch (e) {
        console.error(e);
      } finally {
        setRendering(false);
      }
    };
    if (step === "edit" && blocks.length === 0) {
      bootEdit();
    }
  }, [step]);

  // 편집 블록 초기화: 현재 섹션 범위만 편집하도록 id를 부여해 로컬 상태 구성
  useEffect(() => {
    if (step !== "edit") return;
    const sec: any = sections[activeIdx];
    const start = (sec?.start ?? 0) as number;
    const end = (sec?.end ?? blocks.length) as number;
    const slice = (blocks as any[]).slice(start, end).map((b) => ({ id: crypto.randomUUID(), ...(b as any) }));
    setEditBlocks(slice);
  }, [step, blocks, sections, activeIdx]);

  const next = () => {
    setStep((prev) => {
      switch (prev) {
        case "guide":
          return "progress";
        case "progress":
          return "nick";
        case "nick":
          return "title";
        case "title":
          return "desc";
        case "desc":
          return "edit";
        case "edit":
          return "confirm";
        default:
          return prev;
      }
    });
  };

  const handleBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // 편집/확인/진행/렌더 단계에서는 배경 클릭으로 다음 단계로 넘어가지 않음
    if (step === "edit" || step === "confirm" || step === "progress" || step === "render") return;
    if (step === "nick" || step === "title" || step === "desc") {
      if (stageRef.current && stageRef.current.contains(e.target as Node)) return;
      next();
      return;
    }
    if (step === "guide") {
      fileInputRef.current?.click();
      return;
    }
    next();
  };

  const onChooseFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // markdown 단일 파일도 지원해 빠르게 테스트 가능
    if (/\.(md|markdown)$/i.test(f.name)) {
      const text = await f.text();
      const { convertMarkdown } = await import("@/lib/convert/markdown");
      const part = convertMarkdown(text);
      const h1 = part.find((b) => b.module === "headline_1" && b.content)?.content;
      setRenderTitle(h1 || f.name.replace(/\.(md|markdown)$/i, ""));
      setBlocks(part);
      setStep("render");
      return;
    }
    if (!/\.zip$/i.test(f.name)) {
      alert("ZIP 또는 Markdown 파일을 선택해주세요");
      return;
    }
    // ZIP 즉시 파싱해서 블록/섹션 상태를 채워둔다
    try {
      const { title: t, blocks: b, sections: s, files } = await convertNotionZipToBlocks(f, { mode: "merge" });
      setRenderTitle(t);
      // 파일 Blob URL 매핑 후 이미지 경로 치환
      const urlMap: Record<string, string> = {};
      const allKeys: string[] = [];
      const folderIndex: Record<string, string[]> = {};
      if (files) {
        for (const [path, bytes] of Object.entries(files)) {
          try {
            const u8 = bytes as unknown as Uint8Array;
            const blob = new Blob([new Uint8Array(u8)]);
            const url = URL.createObjectURL(blob);
            const filename = path.split("/").pop() || path;
            urlMap[path] = url;
            urlMap[decodeURIComponent(path)] = url;
            urlMap[filename] = url;
            urlMap[decodeURIComponent(filename)] = url;
            allKeys.push(path, decodeURIComponent(path), filename, decodeURIComponent(filename));
            const folder = (decodeURIComponent(path).includes("/") ? decodeURIComponent(path).slice(0, decodeURIComponent(path).lastIndexOf("/")) : "");
            if (folder) {
              folderIndex[folder] = folderIndex[folder] || [];
              folderIndex[folder].push(url);
            }
          } catch {}
        }
      }
      const resolveUrl = (src: string): string | undefined => {
        if (!src) return undefined;
        const decoded = decodeURIComponent(src);
        const stripDot = src.replace(/^\.\//, "");
        const stripAssets = stripDot.replace(/^assets\//i, "");
        const base = src.split("/").pop() || src;
        const baseDecoded = decodeURIComponent(base);
        const direct = urlMap[src] || urlMap[decoded] || urlMap[stripDot] || urlMap[stripAssets] || urlMap[base] || urlMap[baseDecoded];
        if (direct) return direct;
        const candidates = [decoded, stripDot, stripAssets, base, baseDecoded];
        for (const key of allKeys) {
          const k = key;
          const kd = decodeURIComponent(k);
          if (candidates.some((c) => k.endsWith(c) || kd.endsWith(c))) {
            return urlMap[key] ?? urlMap[kd];
          }
        }
        const folder = decoded.includes("/") ? decoded.slice(0, decoded.lastIndexOf("/")) : "";
        const ext = (baseDecoded.split(".").pop() || "").toLowerCase();
        if (folder && ext) {
          const candidateKey = allKeys.find((k) => {
            const kd2 = decodeURIComponent(k);
            return (kd2.includes(folder + "/") || k.includes(folder + "/")) && kd2.toLowerCase().endsWith("." + ext);
          });
          if (candidateKey) return urlMap[candidateKey];
          const list = folderIndex[folder];
          if (list && list.length > 0) {
            const hit = list.find((u) => u.toLowerCase().includes("." + ext)) || list[0];
            if (hit) return hit;
          }
        }
        return undefined;
      };
      const replaced = (b as any[]).map((blk) => {
        if (blk.module === "image" && blk.imageSrc) {
          const u = resolveUrl(blk.imageSrc);
          if (u) return { ...blk, imageSrc: u };
        }
        return blk;
      });
      setBlocks(replaced as any);
      setSections(s as any);
    } catch (err) {
      console.error("zip parse failed", err);
    }
    setStep("nick");
  };

  const onUpload = async () => {
    if (!file) {
      alert("먼저 ZIP 파일을 선택해주세요");
      setStep("guide");
      return;
    }
    setRendering(true);
    setStep("progress");
    try {
      const { title: t, blocks: b, sections: s, files } = await convertNotionZipToBlocks(file, { mode: "merge" });
      setRenderTitle(title || t);
      setBlocks(b);
      setSections(s);
      console.log(b);
      // 결과 페이지로 라우팅 (쿼리로 전달 - 실제에선 상태/스토리지 사용 권장)
      // 업로드: 파일을 Supabase Storage에 올리고 imageSrc를 public URL로 교체
      const urlMap: Record<string, string> = {};
      for (const [path, bytes] of Object.entries(files)) {
        try {
          const arr = bytes as unknown as Uint8Array;
          const blob = new Blob([new Uint8Array(arr)]);
          const filename = (path.split("/").pop() || path);
          const fd = new FormData();
          fd.append("docId", crypto.randomUUID());
          fd.append("filename", filename);
          fd.append("file", blob, filename);
          const res = await fetch("/api/assets", { method: "POST", body: fd });
          const json = await res.json();
          if (res.ok && json.url) {
            urlMap[path] = json.url;
            urlMap[filename] = json.url;
          }
        } catch {}
      }
      const resolveUrl = (src: string): string | undefined => {
        if (!src) return undefined;
        const decoded = decodeURIComponent(src);
        const stripDot = src.replace(/^\.\//, "");
        const stripAssets = stripDot.replace(/^assets\//i, "");
        const base = (src.split("/").pop() || src);
        const baseDecoded = decodeURIComponent(base);
        return (
          urlMap[src] ||
          urlMap[decoded] ||
          urlMap[stripDot] ||
          urlMap[stripAssets] ||
          urlMap[base] ||
          urlMap[baseDecoded]
        );
      };

      const replacedBlocks = b.map((blk: any) => {
        if (blk.module === "image" && blk.imageSrc) {
          const u = resolveUrl(blk.imageSrc);
          if (u) return { ...blk, imageSrc: u };
        }
        return blk;
      });
      sessionStorage.setItem("__render_blocks__", JSON.stringify({ title: title || t, sections: s, blocks: replacedBlocks }));
      const storedOwner = localStorage.getItem("__owner_id__") || "";
      // 업로드 전 편집 단계로 이동 (편집 완료 후 실제 업로드)
      setBlocks(replacedBlocks);
      setStep("edit");
      return;
      return;
    } catch (err) {
      console.error(err);
      alert("변환 중 오류가 발생했습니다");
      setStep("confirm");
    } finally {
      setRendering(false);
    }
  };

  // 사이드바로 이동하기 전에 현재 섹션 변경 내용을 원본 blocks/sections에 반영
  const persistCurrentEdit = () => {
    if (step !== "edit") return;
    if (!sections.length) return;
    const pure = editBlocks.map(({ id, ...rest }) => rest) as DocsBlockType[];
    const sec: any = sections[activeIdx];
    const start = (sec?.start ?? 0) as number;
    const end = (sec?.end ?? blocks.length) as number;
    const delta = pure.length - (end - start);
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(start, end - start, ...pure);
      return copy as any;
    });
    setSections((prev: any) => {
      const next = prev.map((s: any, idx: number) => {
        if (idx < activeIdx) return s;
        if (idx === activeIdx) return { ...s, end: s.end + delta };
        return { ...s, start: s.start + delta, end: s.end + delta };
      });
      return next;
    });
  };

  const finalizeUpload = async () => {
    try {
      setRendering(true);
      setStep("progress");

      const storedOwner = localStorage.getItem("__owner_id__") || "";
      const effectiveTitle = renderTitle || title || "";
      const hasSections = sections && sections.length > 0;
      const coverUrl = (blocks as any[]).find((b: any) => b?.module === "image" && b?.imageSrc)?.imageSrc as string | undefined;
      const payload: any = {
        title: effectiveTitle,
        coverUrl,
        sections: hasSections
          ? sections.map((sec) => ({ title: sec.title, blocks: blocks.slice((sec as any).start, (sec as any).end) }))
          : [{ title: effectiveTitle, blocks }],
      };
      if (user?.id) payload.ownerId = user.id;
      else if (storedOwner && storedOwner !== "00000000-0000-0000-0000-000000000000") payload.ownerId = storedOwner;
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.slug) {
        router.replace(`/docs/${json.slug}`);
        return;
      }
      alert("업로드 저장에 실패했습니다. 다시 시도해주세요.");
      setStep("confirm");
    } catch (err) {
      console.error(err);
      alert("업로드 중 오류가 발생했습니다");
      setStep("confirm");
    } finally {
      setRendering(false);
    }
  };

  return (
    <Wrap>
      <TopNav />
      <Inner onClick={handleBackgroundClick}>
        <input ref={fileInputRef} type="file" accept=".zip" onChange={onChooseFile} style={{ display: "none" }} />
        {step === "guide" && (
          <Stage ref={stageRef}>
            <H1><Accent>노션</Accent>의 마크다운 파일을 <Accent>업로드</Accent>해주세요!</H1>
            <Sub>아무곳이나 터치하여 파일 첨부</Sub>
          </Stage>
        )}

        {step === "progress" && (
          <Stage ref={stageRef}>
            <H1>문서를 <Accent>업로드</Accent>중입니다!</H1>
            <Sub>잠시만 기다려주세요</Sub>
          </Stage>
        )}

        {step === "nick" && (
          <Stage ref={stageRef}>
            <H1><Accent>닉네임</Accent>을 입력해주세요!</H1>
            <Sub>닉네임은 이후 문서를 공유했을때 표시됩니다</Sub>
            <Input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="" />
          </Stage>
        )}

        {step === "title" && (
          <Stage ref={stageRef}>
            <H1><Accent>문서 제목</Accent>을 입력해주세요</H1>
            <Sub>제목은 이후 문서를 공유했을때 표시됩니다</Sub>
            <Input
              value={title}
              onChange={(e) => {
                const v = e.target.value;
                setTitle(v);
                setRenderTitle(v); // 업로드 시 입력한 제목을 우선 사용
              }}
              placeholder="제목을 입력해주세요"
            />
          </Stage>
        )}

        {step === "desc" && (
          <Stage ref={stageRef}>
            <H1><Accent>문서 설명</Accent>을 짧게 입력해주세요</H1>
            <Sub>설명은 이후 문서를 공유했을때 표시됩니다</Sub>
            <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="설명을 입력해주세요" />
          </Stage>
        )}

        {step === "confirm" && (
          <Stage ref={stageRef}>
            <H1>문서를 <Accent>업로드</Accent> 하시겠습니까?</H1>
            <Sub>업로드하게 될 경우 해당 문서를 누구나 읽을 수 있습니다</Sub>
            <Primary onClick={finalizeUpload}>업로드</Primary>
          </Stage>
        )}

        {step === "edit" && (
          <div style={{ width: "100%", justifySelf: "stretch", alignSelf: "stretch" }}>
            <Split>
              <Sidebar>
                <nav style={{ padding: "24px 16px" }}>
                  {sections.map((sec, i) => (
                    <div
                      key={i}
                      style={{ marginBottom: 6 }}
                      onClick={() => {
                        if (i === activeIdx) return;
                        persistCurrentEdit();
                        setActiveIdx(i);
                      }}
                    >
                      <SidebarItem label={sec.title} module="default" active={i === activeIdx} />
                    </div>
                  ))}
                </nav>
              </Sidebar>

              <Content>
                <DocsEditorToolbar
                  onSave={() => {
                    // 현재 섹션 범위를 편집 결과로 치환하고, 섹션 길이 보정
                    const pure = editBlocks.map(({ id, ...rest }) => rest) as DocsBlockType[];
                    const sec: any = sections[activeIdx];
                    const start = (sec?.start ?? 0) as number;
                    const end = (sec?.end ?? blocks.length) as number;
                    const delta = pure.length - (end - start);
                    setBlocks((prev) => {
                      const copy = [...prev];
                      copy.splice(start, end - start, ...pure);
                      return copy as any;
                    });
                    // 섹션 보정
                    setSections((prev: any) => {
                      const next = prev.map((s: any, idx: number) => {
                        if (idx < activeIdx) return s;
                        if (idx === activeIdx) return { ...s, end: s.end + delta };
                        return { ...s, start: s.start + delta, end: s.end + delta };
                      });
                      return next;
                    });
                    setStep("confirm");
                  }}
                />
                <DocsHeader title={sections[activeIdx]?.title || renderTitle || title || "문서"} breadcrumb={[renderTitle || title || "문서"]} />
                {editBlocks.map((block, i) => (
                  <DocsBlockEditor
                    key={block.id}
                    index={i}
                    block={block as any}
                    onChange={(idx, updated) => {
                      setEditBlocks((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ...(updated as any) } as BlockWithId;
                        return copy;
                      });
                    }}
                    onAddBlock={(idx, nb) => {
                      setEditBlocks((prev) => {
                        const copy = [...prev];
                        const insert: BlockWithId = { id: crypto.randomUUID(), ...(nb as any ?? { module: "docs_1", content: "" }) } as any;
                        copy.splice(idx + 1, 0, insert);
                        return copy;
                      });
                      requestAnimationFrame(() => {
                        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${editBlocks[idx + 1]?.id}']`);
                        el?.focus();
                      });
                    }}
                    onRemoveBlock={(idx) => {
                      setEditBlocks((prev) => {
                        const copy = [...prev];
                        const focusTargetId = idx > 0 ? copy[idx - 1]?.id : copy[idx + 1]?.id;
                        copy.splice(idx, 1);
                        requestAnimationFrame(() => {
                          if (!focusTargetId) return;
                          const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
                          el?.focus();
                        });
                        return copy;
                      });
                    }}
                    onFocusMove={(idx, dir) => {
                      const target = dir === "up" ? idx - 1 : idx + 1;
                      const targetId = editBlocks[target]?.id;
                      if (!targetId) return;
                      requestAnimationFrame(() => {
                        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
                        el?.focus();
                      });
                    }}
                  />
                ))}
              </Content>
            </Split>
          </div>
        )}

        {step === "render" && null}
      </Inner>
    </Wrap>
  );
}

const Wrap = styled.div`
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Inner = styled.div`
  flex: 1;
  padding: 24px; 
  display: grid; 
  place-items: center;
`;

const Stage = styled.div<{ $clickable?: boolean }>`
  max-width: 720px; width: 100%; text-align: center;
  ${({ $clickable }) => ($clickable ? "cursor: pointer;" : "")}
`;

const H1 = styled.div`
  ${({ theme }) => applyTypography(theme, "Headline_4")};
`;

const Accent = styled.span`
  color: ${({ theme }) => theme.colors.textoverflowPurple};
`;

const Sub = styled.p`
  margin-top: 8px; color: ${({ theme }) => theme.colors.grey[600]};
  ${({ theme }) => applyTypography(theme, "Docs_2")}
`;

const Primary = styled.button`
  margin-top: 24px; padding: 12px 20px; border-radius: 10px; border: 1px solid ${({ theme }) => theme.colors.bssmBlue};
  background: white; color: ${({ theme }) => theme.colors.textoverflowPurple}; cursor: pointer;
`;

const Input = styled.input`
  margin: 20px auto 0;
  display: block;
  width: 600px;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  padding: 12px 14px;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  caret-color: ${({ theme }) => theme.colors.grey[900]};
  &::placeholder { color: ${({ theme }) => theme.colors.grey[500]}; }
`;

const TextArea = styled.textarea`
  margin: 20px auto 0;
  display: block;
  width: 600px;
  max-width: 100%;
  height: 160px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  padding: 12px 14px; resize: vertical;
  background: white;
  color: ${({ theme }) => theme.colors.grey[900]};
  caret-color: ${({ theme }) => theme.colors.grey[900]};
  &::placeholder { color: ${({ theme }) => theme.colors.grey[500]}; }
`;

const Sidebar = styled.aside`
  width: 260px;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[200]};
  overflow-y: auto;
  height: 100%;
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const Content = styled.div`
  padding: 0 24px;
  overflow-y: auto;
  height: 100%;
  min-height: 0;
`;
