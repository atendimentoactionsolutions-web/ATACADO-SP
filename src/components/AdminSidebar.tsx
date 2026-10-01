"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  LayoutDashboard,
  CalendarCheck,
  Store,
  Layers,
  Package,
  UploadCloud,
  Settings,
  Users,
  History,
  ExternalLink,
  LogOut,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Preço do Dia",
    href: "/admin/preco-do-dia",
    icon: CalendarCheck,
    badge: "Catálogo",
    badgeColor: "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]",
  },
  {
    name: "Preço Loja Física",
    href: "/admin/preco-loja-fisica",
    icon: Store,
    badge: "Isolado",
    badgeColor: "bg-[#ede7f6] text-[#4a148c] border-[#d1c4e9]",
  },
  {
    name: "Categorias",
    href: "/admin/categorias",
    icon: Layers,
  },
  {
    name: "Produtos",
    href: "/admin/produtos",
    icon: Package,
  },
  {
    name: "Importar Produtos",
    href: "/admin/importar",
    icon: UploadCloud,
  },
  {
    name: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
  {
    name: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    name: "Logs & Histórico",
    href: "/admin/logs",
    icon: History,
  },
];

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#e5e5ea]">
      {/* Brand */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#e5e5ea]">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shadow-sm">
            <Apple className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#1d1d1f]">iFindz Admin</div>
            <div className="text-[10px] text-[#86868b] -mt-0.5">Gestão Apple</div>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-[#86868b] hover:bg-[#f5f5f7]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav list */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
          Menu Administrativo
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-[#86868b]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "bg-white/20 text-white border-transparent"
                      : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#e5e5ea] space-y-1.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#0071e3] bg-[#0071e3]/5 hover:bg-[#0071e3]/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span>Ver Catálogo Público</span>
          </div>
          <span className="text-[10px] bg-[#0071e3] text-white px-1.5 py-0.5 rounded font-bold">
            LIVE
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
