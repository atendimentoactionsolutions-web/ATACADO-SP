"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import AppleLogo from "./AppleLogo";

export default function Navbar() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e5ea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <AppleLogo className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">
              ATACADO SP
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#86868b] font-medium -mt-1">
              Especialista Apple
            </span>
          </div>
        </Link>

        {/* Right CTA */}
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            title="Encerrar sessão"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
