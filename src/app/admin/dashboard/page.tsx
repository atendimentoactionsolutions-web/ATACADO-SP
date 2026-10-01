"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import {
  Package,
  CalendarCheck,
  Store,
  Layers,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UploadCloud,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatBRL } from "@/lib/price-calculator";

interface DashboardData {
  stats: {
    totalProducts: number;
    totalNovos: number;
    totalSeminovos: number;
    totalIphones: number;
    totalCategories: number;
    publishedPrecoDoDia: number;
    totalLojaFisica: number;
    lastPriceUpdate: string;
  };
  recentlyModified: any[];
  categoriesBreakdown: { id: string; name: string; slug: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Dashboard Geral"
        subtitle="Visão executiva do catálogo, inventário e cotações Apple"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Destaque: Publicados Preço do Dia */}
          <div className="bg-gradient-to-br from-white to-[#e8f5e9]/50 rounded-3xl p-6 border border-[#c8e6c9] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1b5e20] uppercase tracking-wider">
                Catálogo Oficial
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 text-[#1b5e20] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-[#1d1d1f]">
                {loading ? "-" : data?.stats.publishedPrecoDoDia}
              </div>
              <div className="text-xs text-[#1b5e20] font-medium mt-1">
                Publicados no Preço do Dia
              </div>
              <div className="text-[10px] text-[#86868b] mt-0.5">
                (Apenas Novos/Lacrados e Ativos)
              </div>
            </div>
          </div>

          {/* Total Produtos Cadastrados */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                Total de Produtos
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-[#1d1d1f]">
                {loading ? "-" : data?.stats.totalProducts}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#86868b]">
                <span>{data?.stats.totalNovos} Novos</span>
                <span>•</span>
                <span>{data?.stats.totalSeminovos} Seminovos</span>
              </div>
            </div>
          </div>

          {/* Total iPhones */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                Linha iPhone
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-[#1d1d1f]">
                {loading ? "-" : data?.stats.totalIphones}
              </div>
              <div className="text-xs text-[#0071e3] font-medium mt-1">
                +R$ 200 automático em Novos
              </div>
              <div className="text-[10px] text-[#86868b] mt-0.5">
                Regra exclusiva para iPhone Preço do Dia
              </div>
            </div>
          </div>

          {/* Loja Física (Preço Isolado) */}
          <div className="bg-gradient-to-br from-white to-[#ede7f6]/50 rounded-3xl p-6 border border-[#d1c4e9] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4a148c] uppercase tracking-wider">
                Loja Física
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#4a148c]/10 text-[#4a148c] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-[#1d1d1f]">
                {loading ? "-" : data?.stats.totalLojaFisica}
              </div>
              <div className="text-xs text-[#4a148c] font-medium mt-1">
                Preços de Balcão Isolados
              </div>
              <div className="text-[10px] text-[#86868b] mt-0.5">
                Não misturados com Preço do Dia
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm">
          <h2 className="text-sm font-bold text-[#1d1d1f] mb-4">Ações Rápidas do Sistema</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/preco-do-dia"
              className="p-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-all flex flex-col justify-between group"
            >
              <CalendarCheck className="w-5 h-5 text-[#0071e3] group-hover:scale-110 transition-transform" />
              <div className="mt-3">
                <div className="text-xs font-semibold text-[#1d1d1f]">Preço do Dia</div>
                <div className="text-[10px] text-[#86868b]">Gerenciar cotações ativas</div>
              </div>
            </Link>

            <button
              onClick={async () => {
                const btn = document.getElementById("dash-sync-btn");
                if (btn) btn.innerText = "Sincronizando...";
                try {
                  const res = await fetch("/api/sync/mundo-apple", { method: "POST" });
                  const data = await res.json();
                  if (data.success) {
                    alert(`Sincronização concluída com sucesso do Mundo Apple! ${data.uniqueAppleModels} modelos atualizados com o menor preço oficial.`);
                    loadDashboard();
                  } else {
                    alert(data.error);
                  }
                } catch (e: any) {
                  alert(e.message);
                } finally {
                  if (btn) btn.innerText = "Puxar Preço do Dia (Mundo Apple)";
                }
              }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 transition-all flex flex-col justify-between text-left group"
            >
              <Sparkles className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="mt-3">
                <div id="dash-sync-btn" className="text-xs font-bold text-emerald-900">
                  Puxar Preço do Dia (Mundo Apple)
                </div>
                <div className="text-[10px] text-emerald-700">
                  mundo-apple-buscador.onrender.com
                </div>
              </div>
            </button>

            <Link
              href="/admin/importar"
              className="p-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-all flex flex-col justify-between group"
            >
              <UploadCloud className="w-5 h-5 text-[#34c759] group-hover:scale-110 transition-transform" />
              <div className="mt-3">
                <div className="text-xs font-semibold text-[#1d1d1f]">Importar Produtos</div>
                <div className="text-[10px] text-[#86868b]">CSV, Excel e JSON com preview</div>
              </div>
            </Link>

            <a
              href="/api/export?format=xlsx"
              download
              className="p-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-all flex flex-col justify-between group"
            >
              <Download className="w-5 h-5 text-[#ff9500] group-hover:scale-110 transition-transform" />
              <div className="mt-3">
                <div className="text-xs font-semibold text-[#1d1d1f]">Exportar Excel</div>
                <div className="text-[10px] text-[#86868b]">Apenas produtos elegíveis</div>
              </div>
            </a>

            <Link
              href="/"
              target="_blank"
              className="p-4 rounded-2xl bg-black text-white hover:bg-[#1d1d1f] transition-all flex flex-col justify-between group"
            >
              <ExternalLink className="w-5 h-5 text-[#34c759] group-hover:scale-110 transition-transform" />
              <div className="mt-3">
                <div className="text-xs font-semibold text-white">Ver Catálogo Live</div>
                <div className="text-[10px] text-gray-300">Visualização do cliente</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Categories Breakdown & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories distribution */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm">
            <h2 className="text-sm font-bold text-[#1d1d1f] mb-4 flex items-center justify-between">
              <span>Categorias Apple</span>
              <span className="text-xs font-normal text-[#86868b]">
                {data?.stats.totalCategories} ativas
              </span>
            </h2>

            <div className="space-y-3">
              {data?.categoriesBreakdown.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#f5f5f7] text-xs"
                >
                  <span className="font-semibold text-[#1d1d1f]">{c.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#1d1d1f] font-mono font-bold shadow-xs">
                    {c.count} itens
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recently modified products */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#1d1d1f]">
                  Produtos Alterados Recentemente
                </h2>
                <p className="text-[11px] text-[#86868b]">
                  Registro das últimas cotações e alterações no inventário
                </p>
              </div>
              <Link
                href="/admin/preco-do-dia"
                className="text-xs font-medium text-[#0071e3] hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f5f5f7] text-[#86868b]">
                    <th className="pb-3 font-semibold">Produto</th>
                    <th className="pb-3 font-semibold">Condição</th>
                    <th className="pb-3 font-semibold">Original</th>
                    <th className="pb-3 font-semibold">Margem</th>
                    <th className="pb-3 font-semibold">Final</th>
                    <th className="pb-3 font-semibold">Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {data?.recentlyModified.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#fbfbfd]">
                      <td className="py-3 font-semibold text-[#1d1d1f]">
                        <div>{prod.name}</div>
                        <div className="text-[10px] text-[#86868b]">{prod.category?.name}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            prod.condition === "NOVO_LACRADO"
                              ? "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]"
                              : "bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]"
                          }`}
                        >
                          {prod.condition === "NOVO_LACRADO" ? "Novo Lacrado" : "Seminovo"}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[#86868b]">
                        {formatBRL(prod.originalPrice)}
                      </td>
                      <td className="py-3 font-mono font-semibold text-[#34c759]">
                        +{formatBRL(prod.margin)}
                      </td>
                      <td className="py-3 font-mono font-bold text-[#1d1d1f]">
                        {formatBRL(prod.finalPrice)}
                      </td>
                      <td className="py-3 text-[10px] text-[#86868b]">
                        {new Date(prod.updatedAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
