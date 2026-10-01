"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import AppleLogo from "@/components/AppleLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Credenciais incorretas.");
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5ea]">
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            Usuário ou E-mail
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Usuário ou e-mail"
              autoComplete="username"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f5f7] text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 border border-transparent focus:border-[#0071e3]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
            Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              autoComplete="current-password"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f5f7] text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 border border-transparent focus:border-[#0071e3]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shadow-sm disabled:opacity-50"
        >
          <span>{loading ? "Autenticando..." : "Entrar"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center p-3 shadow-md">
              <AppleLogo className="w-full h-full" variant="white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            ATACADO SP
          </h1>
        </div>

        {/* Suspense boundary for useSearchParams */}
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5ea] text-center text-xs text-[#86868b]">
              Carregando formulário de autenticação...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
