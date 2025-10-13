"use client";

import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

type Doc = {
  id: string;
  title: string;
  description: string;
  cover?: string;
};

export function DocCard({ doc }: { doc: Doc }) {
  const onClick = () => {
    window.location.href = `/docs/${doc.id}`;
  };

  return (
    <Card onClick={onClick}>
      <Thumb>
        {doc.cover ? <img src={doc.cover} alt="" /> : <Placeholder>OFFAIR</Placeholder>}
      </Thumb>
      <Title>{doc.title}</Title>
      <Desc>{doc.description}</Desc>
    </Card>
  );
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

const Placeholder = styled.div`
  font-weight: 800;
  color: ${({ theme }) => theme.colors.bssmBlue};
`;

const Title = styled.h3`
  margin: 12px 0 4px;
  ${({ theme }) => applyTypography(theme, "Headline_4")}
`;

const Desc = styled.p`
  color: ${({ theme }) => theme.colors.grey[700]};
  ${({ theme }) => applyTypography(theme, "Docs_3")}
`;


