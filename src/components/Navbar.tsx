"use client";

import Link from "next/link";
import { ShieldCheck, User, Sparkles } from "lucide-react";
import AppleLogo from "./AppleLogo";

export default function Navbar() {
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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] rounded-lg hover:bg-[#f5f5f7] transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Painel Administrativo</span>
            <span className="sm:hidden">Admin</span>
          </Link>
          <a
            href="https://wa.me/5511930089729"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-sm transition-all hover:shadow"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Falar com Especialista</span>
          </a>
        </div>
      </div>
    </header>
  );
}
