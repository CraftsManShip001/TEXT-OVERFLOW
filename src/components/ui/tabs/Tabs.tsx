"use client";

import styled from "@emotion/styled";
import { useRouter, useSearchParams } from "next/navigation";
import { applyTypography } from "@/lib/themeHelper";

export function Tabs({ active }: { active: "trending" | "latest" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onClick = (tab: "trending" | "latest") => {
    if (tab === active) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.push(`/?${next.toString()}`);
  };

  return (
    <TabsWrap>
      <TabButton $active={active === "trending"} onClick={() => onClick("trending")}>트렌딩</TabButton>
      <TabButton $active={active === "latest"} onClick={() => onClick("latest")}>최신</TabButton>
    </TabsWrap>
  );
}

const TabsWrap = styled.div`
  display: flex;
  gap: 16px;
  margin: 12px 0 24px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.grey[700])};
  border-bottom: 2px solid
    ${({ theme, $active }) => ($active ? theme.colors.text : "transparent")};
  ${({ theme, $active }) => ($active ? applyTypography(theme, "Body_3") : applyTypography(theme, "Docs_1"))}
`;