"use client";

import styled from "@emotion/styled";
import Image from "next/image";

export function TopNav() {
  return (
    <Header>
      <Nav>
      <LogoWrapper>
        <Image
          src="/MainLogo.svg"
          alt="TEXT-OVERFLOW"
          width={200}
          height={50}
          priority
        />
      </LogoWrapper>
      </Nav>

      <LoginButton>로그인</LoginButton>
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  height: 69px;
  padding: 0 2rem;
  background: ${({ theme }) => theme.colors.background};
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    object-fit: contain;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  width:1447px;
  gap: 69px;
`;

const LoginButton = styled.button`
  border: none;
  background: none;
  width:65px;
  height:35px;
  color: ${({ theme }) => theme.colors.bssmGrey};
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
`;
