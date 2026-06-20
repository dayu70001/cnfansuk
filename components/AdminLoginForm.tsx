"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) {
          setError(result.error || "登录失败，请重试。");
          setLoading(false);
          return;
        }
        router.replace("/admin");
        router.refresh();
      }}>
        <p className="eyebrow">管理后台</p>
        <h1>CNFans UK 管理后台</h1>
        <p>请输入管理员密码或令牌。</p>
        <label className="admin-field">
          <span>管理员密码</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="btn btn-solid" type="submit" disabled={loading}>{loading ? "正在登录…" : "登录"}</button>
      </form>
    </main>
  );
}
