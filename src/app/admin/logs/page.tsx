"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { History, ShieldAlert, ArrowRight, User, Calendar, RefreshCw, FileText } from "lucide-react";
import { formatBRL } from "@/lib/price-calculator";

export default function LogsAdminPage() {
  const [activeTab, setActiveTab] = useState<"prices" | "audit">("prices");
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const histRes = await fetch("/api/history");
      const histData = await histRes.json();
      if (histData.success) {
        setPriceHistory(histData.history || []);
      }

      const logsRes = await fetch("/api/logs");
      const logsData = await logsRes.json();
      if (logsData.success) {
        setAuditLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Histórico de Preços e Logs de Auditoria"
        subtitle="Rastreabilidade completa de todas as alterações de cotações e ações no sistema"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Tabs and Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-[#e5e5ea] shadow-xs">
            <button
              onClick={() => setActiveTab("prices")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "prices"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Histórico de Alterações de Preços
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "audit"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Logs de Auditoria do Sistema
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl text-[#86868b] hover:bg-[#f5f5f7] transition-colors flex items-center gap-1.5 text-xs bg-white border border-[#e5e5ea]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recarregar</span>
          </button>
        </div>

        {/* Tab 1: Price History */}
        {activeTab === "prices" && (
          <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e5ea] text-xs text-[#86868b]">
              Exibindo as últimas <strong className="text-[#1d1d1f]">{priceHistory.length}</strong>{" "}
              movimentações de cotações de produtos
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                    <th className="py-3 px-4 font-semibold">Produto</th>
                    <th className="py-3 px-3 font-semibold">Preço Anterior</th>
                    <th className="py-3 px-3 font-semibold">Novo Preço</th>
                    <th className="py-3 px-3 font-semibold">Margem</th>
                    <th className="py-3 px-3 font-semibold">Preço Final</th>
                    <th className="py-3 px-3 font-semibold">Responsável</th>
                    <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#86868b]">
                        Carregando histórico...
                      </td>
                    </tr>
                  ) : priceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#86868b]">
                        Nenhum registro de preço encontrado.
                      </td>
                    </tr>
                  ) : (
                    priceHistory.map((h) => {
                      const date = new Date(h.createdAt);
                      const formattedDate = date.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                      const formattedTime = date.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const priceChanged = h.oldPrice !== h.newPrice;

                      return (
                        <tr key={h.id} className="hover:bg-[#fbfbfd]">
                          <td className="py-3.5 px-4 font-semibold text-[#1d1d1f]">
                            <div>{h.product?.name || "Produto"}</div>
                            {h.reason && (
                              <div className="text-[10px] text-[#86868b] italic">"{h.reason}"</div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[#86868b]">
                            {formatBRL(h.oldPrice)}
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-[#1d1d1f]">
                            {formatBRL(h.newPrice)}
                          </td>

                          <td className="py-3.5 px-3 font-mono font-semibold text-[#34c759]">
                            +{formatBRL(h.margin)}
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-sm text-[#1d1d1f]">
                            {formatBRL(h.finalPrice)}
                          </td>

                          <td className="py-3.5 px-3 text-[#1d1d1f] font-medium">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#0071e3]" />
                              <span>{h.userResponsible}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[#86868b] whitespace-nowrap">
                            {formattedDate} às {formattedTime}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e5ea] text-xs text-[#86868b]">
              Registro cronológico de ações administrativas
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                    <th className="py-3 px-4 font-semibold">Ação</th>
                    <th className="py-3 px-3 font-semibold">Entidade</th>
                    <th className="py-3 px-3 font-semibold">Usuário</th>
                    <th className="py-3 px-4 font-semibold">Detalhes</th>
                    <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[#86868b]">
                        Carregando logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[#86868b]">
                        Nenhum log registrado.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const date = new Date(log.createdAt);
                      return (
                        <tr key={log.id} className="hover:bg-[#fbfbfd]">
                          <td className="py-3.5 px-4 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] ${
                                log.action === "CREATE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : log.action === "UPDATE"
                                  ? "bg-blue-50 text-blue-700"
                                  : log.action === "DELETE"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-medium text-[#1d1d1f]">
                            {log.entity}
                          </td>

                          <td className="py-3.5 px-3 text-[#1d1d1f]">
                            {log.userName || "Sistema"}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#86868b] max-w-xs truncate">
                            {log.details}
                          </td>

                          <td className="py-3.5 px-4 text-[#86868b] whitespace-nowrap">
                            {date.toLocaleDateString("pt-BR")} às{" "}
                            {date.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
