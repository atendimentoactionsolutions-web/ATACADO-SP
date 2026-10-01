"use client";

import { Menu, UserCheck, Bell, Shield } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  onOpenMobile?: () => void;
  title?: string;
  subtitle?: string;
}

export default function AdminHeader({
  onOpenMobile,
  title = "Painel iFindz",
  subtitle = "Sistema de Gestão de Preços Apple",
}: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#e5e5ea] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl text-[#86868b] hover:bg-[#f5f5f7] border border-[#e5e5ea]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f]">
            {title}
          </h1>
          <p className="text-[11px] text-[#86868b] hidden sm:block -mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-xs text-[#1d1d1f]">
          <Shield className="w-3.5 h-3.5 text-[#34c759]" />
          <span>Sessão Segura</span>
        </div>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            AD
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-[#1d1d1f]">Administrador</div>
            <div className="text-[10px] text-[#86868b]">admin@ifindz.com.br</div>
          </div>
        </div>
      </div>
    </header>
  );
}
