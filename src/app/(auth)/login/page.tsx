"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.replace("/");
    return null;
  }

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!error) router.replace("/");
    else alert(error.message);
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
  };

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "40px auto" }}>
      <h2>로그인</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" style={{ width: "100%", marginTop: 12, padding: 10 }} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" style={{ width: "100%", marginTop: 12, padding: 10 }} />
      <button onClick={signIn} disabled={loading} style={{ marginTop: 12, width: "100%" }}>이메일 로그인</button>
      <button onClick={signInWithGithub} style={{ marginTop: 8, width: "100%" }}>GitHub로 로그인</button>
    </div>
  );
}


