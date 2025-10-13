"use client";

import styled from "@emotion/styled";
import { useRef, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { applyTypography } from "@/lib/themeHelper";
import { convertNotionZipToBlocks } from "@/lib/convert/notionZip";
import { DocsBlockRender } from "@/components/docs/DocsBlockRender";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import { useRouter } from "next/navigation";
import type { DocsBlock as DocsBlockType } from "@/types/docs";

type Step = "guide" | "progress" | "nick" | "title" | "desc" | "confirm" | "render";

export function UploadFlow() {
  const router = useRouter();
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
          return "confirm";
        default:
          return prev;
      }
    });
  };

  const handleBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (step === "confirm" || step === "progress" || step === "render") return;
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
      const urlMap: Record<string, string> = {};
      Object.entries(files).forEach(([path, bytes]) => {
        try {
          const arr = bytes as unknown as Uint8Array;
          const blob = new Blob([new Uint8Array(arr)]);
          const url = URL.createObjectURL(blob);
          const key = (path.split("/").pop() || path);
          urlMap[path] = url;
          urlMap[key] = url; // 파일명 기준 매핑도 같이 저장
        } catch {}
      });
      sessionStorage.setItem("__render_blocks__", JSON.stringify({ title: title || t, sections: s, blocks: b }));
      sessionStorage.setItem("__render_files__", JSON.stringify(urlMap));
      router.push("/viewer/result");
      return;
    } catch (err) {
      console.error(err);
      alert("변환 중 오류가 발생했습니다");
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해주세요" />
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
            <Primary onClick={onUpload}>업로드</Primary>
          </Stage>
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
`;


