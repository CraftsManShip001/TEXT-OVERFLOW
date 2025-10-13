"use client";

import styled from "@emotion/styled";
import { TopNav } from "./TopNav";
import { DocsSidebar } from "./DocsSidebar";

export function DocsLayout({ children, sidebar }: { children: React.ReactNode; sidebar?: React.ReactNode }) {
  return (
    <Wrapper>
      <TopNav />
      <Body>
        <Sidebar>
          {sidebar ?? <DocsSidebar />}
        </Sidebar>
        <Content>{children}</Content>
      </Body>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 260px;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[200]};
  overflow-y: auto;
`;

const Content = styled.main`
  flex: 1;
  padding: 48px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;
