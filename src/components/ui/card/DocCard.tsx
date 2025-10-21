"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { applyTypography } from "@/lib/themeHelper";

type Doc = {
  id: string;
  title: string;
  description: string;
  author?: string;
  cover?: string;
};

export function DocCard({ doc }: { doc: Doc }) {
  const onClick = () => {
    window.location.href = `/docs/${doc.id}`;
  };

  const initials = getInitials(doc.title);
  const [c1, c2] = stringToGradient(doc.title);
  const [imgErr, setImgErr] = useState(false);

  return (
    <Card onClick={onClick}>
      <Thumb>
        {doc.cover && !imgErr ? (
          <img src={doc.cover} alt="cover" onError={() => setImgErr(true)} />
        ) : (
          <DynamicCover $c1={c1} $c2={c2}>
            <span>{initials}</span>
          </DynamicCover>
        )}
      </Thumb>
      <Title>{doc.title}</Title>
      {doc.author && <Author>by {doc.author}</Author>}
      <Desc>{doc.description}</Desc>
    </Card>
  );
}

// Utilities: dynamic gradient & initials
function getInitials(title: string) {
  const words = (title || "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function stringToGradient(s: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  const c1 = `hsl(${h1}, 75%, 65%)`;
  const c2 = `hsl(${h2}, 75%, 55%)`;
  return [c1, c2];
}

const Card = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
`;

const Thumb = styled.div`
  aspect-ratio: 1 / 1;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.grey[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  & > img { width: 100%; height: 100%; object-fit: cover; }
`;

const DynamicCover = styled.div<{ $c1: string; $c2: string }>`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, ${({ $c1 }) => $c1}, ${({ $c2 }) => $c2});
  background-size: 200% 200%;
  animation: move 6s ease infinite;
  span { color: white; font-weight: 800; font-size: 28px; letter-spacing: 1px; }
  @keyframes move {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const Title = styled.h3`
  margin: 12px 0 4px;
  ${({ theme }) => applyTypography(theme, "Headline_4")}
`;

const Author = styled.p`
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.grey[500]};
  ${({ theme }) => applyTypography(theme, "Docs_3")}
`;

const Desc = styled.p`
  color: ${({ theme }) => theme.colors.grey[700]};
  ${({ theme }) => applyTypography(theme, "Docs_3")}
`;


