"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function TopNav() {
  const { data } = useSession();
  const user = data?.user;
  const router = useRouter();

  const onLogin = () => signIn("google", { callbackUrl: "/" });
  const onLogout = () => signOut();

  return (
    <Header>
      <Nav>
        <LogoWrapper onClick={() => router.push("/") }>
          <Image
            src="/MainLogo.svg"
            alt="TEXT-OVERFLOW"
            width={200}
            height={50}
            priority
          />
        </LogoWrapper>
      </Nav>
      <Right>
        {user && <UserName>{user.name || user.email}</UserName>}
        {user ? (
          <LoginButton onClick={onLogout}>로그아웃</LoginButton>
        ) : (
          <LoginButton onClick={onLogin}>로그인</LoginButton>
        )}
      </Right>
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
  justify-content: space-between;
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
  flex: 1;
  min-width: 0;
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

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
`;

const UserName = styled.span`
  color: ${({ theme }) => theme.colors.grey[600]};
  font-size: 15px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
