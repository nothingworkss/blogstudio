"use client";

import { useState } from "react";
import { Cookie, Lock } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      window.location.reload();
    } else {
      const data = await response.json();
      setError(data.error ?? "로그인에 실패했습니다.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-4">
      <form onSubmit={login} className="w-full max-w-sm rounded-md border border-[#e5ddd2] bg-white p-6 shadow-[0_18px_50px_rgba(70,52,34,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-[#f6d7a8] text-[#5a3421]">
            <Cookie className="size-5" />
          </div>
          <div>
            <h1 className="font-serif text-[20px] font-semibold leading-none">nothingmatters blog studio</h1>
            <p className="mt-2 text-[13px] text-[#7a7064]">관리자 비밀번호로 접속하세요.</p>
          </div>
        </div>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold">관리자 비밀번호</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 rounded-md bg-[#fff0ed] p-2 text-[12px] text-[#c34d42]">{error}</p> : null}
        <Button type="submit" variant="primary" className="mt-5 w-full" icon={<Lock className="size-4" />}>
          들어가기
        </Button>
      </form>
    </main>
  );
}
