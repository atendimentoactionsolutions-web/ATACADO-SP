"use client";

import { useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Check,
  ShieldAlert,
} from "lucide-react";
import { formatBRL } from "@/lib/price-calculator";

interface PreviewItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  storage: string | null;
  color: string | null;
  condition: "NOVO_LACRADO" | "SEMINOVO";
  priceSource: "PRECO_DO_DIA" | "LOJA_FISICA";
  originalPrice: number;
  margin: number;
  finalPrice: number;
  publishedInCatalog: boolean;
  statusNotice: string;
  isValid: boolean;
}

export default function ImportarProdutosAdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [stats, setStats] = useState<{ total: number; eligible: number; seminovos: number } | null>(
    null
  );
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setPreviewItems([]);
      setCommitResult(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    try {
      setLoadingPreview(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao processar arquivo");
      }

      setPreviewItems(data.preview || []);
      setStats({
        total: data.total,
        eligible: data.eligibleForCatalogCount,
        seminovos: data.seminovosCount,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (previewItems.length === 0) return;

    try {
      setCommitting(true);
      setError(null);

      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: previewItems }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao salvar produtos importados.");
      }

      setCommitResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  // Download sample files
  const downloadSampleCSV = () => {
    const csvContent =
      "produto,categoria,capacidade,cor,condicao,preco\n" +
      "iPhone 17 Pro Max 256GB,iPhone,256GB,Titânio Natural,NOVO_LACRADO,7550.00\n" +
      "iPad 11 A16 128GB,iPad,128GB,Prateado,NOVO_LACRADO,3350.00\n" +
      "iPhone 16 Pro Max 256GB Seminovo,iPhone,256GB,Preto Espacial,SEMINOVO,5400.00\n" +
      "MacBook Air M3 16GB 256GB,Mac,256GB,Estelar,NOVO_LACRADO,7990.00\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_importacao_ifindz.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Importar Produtos"
        subtitle="Importação em lote por CSV, Excel ou JSON com pré-visualização inteligente"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Card de Upload */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f5f5f7] pb-6 mb-6">
            <div>
              <h2 className="text-sm font-bold text-[#1d1d1f]">
                Carregar Arquivo de Cotações / Produtos
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Formatos aceitos: Planilha Excel (.xlsx, .xls), Arquivo CSV (.csv) ou JSON (.json)
              </p>
            </div>

            <button
              onClick={downloadSampleCSV}
              className="px-3.5 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-[#0071e3]" />
              <span>Baixar Modelo CSV</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed border-[#d2d2d7] rounded-3xl p-8 text-center hover:border-[#0071e3] transition-colors bg-[#fbfbfd]">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#1d1d1f]">
                  {file ? file.name : "Clique para selecionar o arquivo da cotação"}
                </div>
                <div className="text-[11px] text-[#86868b]">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB selecionado`
                    : "Suporta CSV, XLSX ou JSON com colunas de produto, categoria, cor, condição e preço"}
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {file && !commitResult && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleProcessFile}
                disabled={loadingPreview}
                className="px-6 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                <span>{loadingPreview ? "Processando arquivo..." : "Gerar Pré-visualização"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Commit Success Message */}
        {commitResult && (
          <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-3xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1b5e20] text-white flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#1b5e20]">
              Importação Concluída com Sucesso!
            </h3>
            <p className="text-xs text-[#1b5e20]/80">
              Foram cadastrados com sucesso <strong>{commitResult.createdCount}</strong> produtos no
              banco de dados com as margens recalculadas e histórico registrado.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewItems([]);
                  setCommitResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-[#1b5e20] border border-[#c8e6c9]"
              >
                Nova Importação
              </button>
              <a
                href="/admin/preco-do-dia"
                className="px-4 py-2 rounded-xl bg-[#1b5e20] text-white text-xs font-semibold"
              >
                Ir para Preço do Dia
              </a>
            </div>
          </div>
        )}

        {/* Tabela de Pré-visualização (Requisito 11 Obrigatório) */}
        {previewItems.length > 0 && !commitResult && (
          <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            {/* Header com KPIs do arquivo */}
            <div className="px-6 py-5 border-b border-[#e5e5ea] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-[#1d1d1f]">
                  Pré-visualização da Importação
                </h3>
                <p className="text-xs text-[#86868b]">
                  Confira as margens calculadas e a elegibilidade para o catálogo antes de salvar
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="font-semibold text-[#1b5e20]">
                    {stats?.eligible} produtos elegíveis
                  </span>
                  <span className="text-[#86868b] block text-[10px]">
                    {stats?.seminovos} seminovos excluídos da publicação
                  </span>
                </div>

                <button
                  onClick={handleCommit}
                  disabled={committing}
                  className="px-6 py-2.5 rounded-xl bg-[#34c759] hover:bg-[#2eb34f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{committing ? "Salvando..." : "Confirmar e Salvar no Sistema"}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                    <th className="py-3 px-4 font-semibold">Produto</th>
                    <th className="py-3 px-3 font-semibold">Condição</th>
                    <th className="py-3 px-3 font-semibold">Preço Original</th>
                    <th className="py-3 px-3 font-semibold">Margem Aplicada</th>
                    <th className="py-3 px-3 font-semibold">Preço Final</th>
                    <th className="py-3 px-4 font-semibold">Publicação no Preço do Dia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {previewItems.map((item) => {
                    const isIphoneNovo =
                      item.categorySlug === "iphone" && item.condition === "NOVO_LACRADO";

                    return (
                      <tr key={item.id} className="hover:bg-[#fbfbfd]">
                        <td className="py-3 px-4 font-semibold text-[#1d1d1f]">
                          <div>{item.name}</div>
                          <div className="text-[10px] text-[#86868b]">
                            {item.categoryName}{" "}
                            {item.storage ? `• ${item.storage}` : ""}{" "}
                            {item.color ? `• ${item.color}` : ""}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.condition === "NOVO_LACRADO"
                                ? "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]"
                                : "bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]"
                            }`}
                          >
                            {item.condition === "NOVO_LACRADO" ? "Novo Lacrado" : "Seminovo"}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[#86868b]">
                          {formatBRL(item.originalPrice)}
                        </td>

                        <td className="py-3 px-3 font-mono">
                          {item.margin > 0 ? (
                            <span className="font-bold text-[#34c759]">
                              +{formatBRL(item.margin)}
                            </span>
                          ) : (
                            <span className="text-[#86868b]">R$ 0,00</span>
                          )}
                          {isIphoneNovo && (
                            <span className="block text-[9px] text-[#1b5e20]">
                              (Regra iPhone +200)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-sm text-[#1d1d1f]">
                          {formatBRL(item.finalPrice)}
                        </td>

                        <td className="py-3 px-4">
                          {item.publishedInCatalog ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1b5e20]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                              <span>Publicado no Preço do Dia</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#e65100]">
                              <ShieldAlert className="w-3.5 h-3.5 text-[#e65100]" />
                              <span>{item.statusNotice}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
