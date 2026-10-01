"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/AdminHeader";
import ProductFormModal from "@/components/ProductFormModal";
import PriceHistoryModal from "@/components/PriceHistoryModal";
import {
  Search,
  Filter,
  Plus,
  Download,
  Copy,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  FileCode,
} from "lucide-react";
import { formatBRL } from "@/lib/price-calculator";

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  subcategoryId?: string;
  subcategory?: { id: string; name: string };
  model: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  condition: string;
  priceSource: string;
  originalPrice: number;
  margin: number;
  finalPrice: number;
  active: boolean;
  updatedAt: string;
}

export default function PrecoDoDiaAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [onlyNovo, setOnlyNovo] = useState(false);
  const [hideSeminovo, setHideSeminovo] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // Quick price edit state
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickNewPrice, setQuickNewPrice] = useState<string>("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Sincronização ao vivo Mundo Apple Buscador
  const [syncingLive, setSyncingLive] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncMundoApple = async () => {
    try {
      setSyncingLive(true);
      setSyncMessage(null);
      const res = await fetch("/api/sync/mundo-apple", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(
          `Cotação do Dia sincronizada com sucesso do Mundo Apple! ${data.uniqueAppleModels} modelos atualizados com a melhor cotação de ${data.totalRawProducts} produtos analisados ao vivo.`
        );
        loadProducts();
      } else {
        alert(data.error || "Erro ao sincronizar do Mundo Apple.");
      }
    } catch (err: any) {
      alert("Falha na sincronização: " + err.message);
    } finally {
      setSyncingLive(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products?source=PRECO_DO_DIA");
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
      }

      const catRes = await fetch("/api/categories");
      const catJson = await catRes.json();
      if (catJson.success) {
        setCategories(catJson.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Storages para filtro
  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.storage) set.add(p.storage);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtros combinados no cliente
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (onlyNovo && p.condition !== "NOVO_LACRADO") return false;
      if (hideSeminovo && p.condition === "SEMINOVO") return false;
      if (selectedCondition !== "all" && p.condition !== selectedCondition) return false;
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory && p.category?.slug !== selectedCategory) {
        return false;
      }
      if (selectedStorage !== "all" && p.storage !== selectedStorage) return false;
      if (selectedStatus === "active" && !p.active) return false;
      if (selectedStatus === "inactive" && p.active) return false;

      if (search.trim() !== "") {
        const term = search.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(term);
        const mModel = p.model.toLowerCase().includes(term);
        const mColor = p.color ? p.color.toLowerCase().includes(term) : false;
        const mStorage = p.storage ? p.storage.toLowerCase().includes(term) : false;
        const mCat = p.category?.name.toLowerCase().includes(term);
        if (!mName && !mModel && !mColor && !mStorage && !mCat) return false;
      }

      return true;
    });
  }, [
    products,
    onlyNovo,
    hideSeminovo,
    selectedCondition,
    selectedCategory,
    selectedStorage,
    selectedStatus,
    search,
  ]);

  // Ações
  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      const data = await res.json();
      if (data.success) {
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (product: Product) => {
    if (!confirm(`Deseja duplicar o produto "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    const parsed = parseFloat(quickNewPrice);
    if (isNaN(parsed) || parsed < 0) {
      alert("Preço inválido.");
      return;
    }

    try {
      setQuickSaving(true);
      const res = await fetch(`/api/products/${quickEditProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPrice: parsed,
          reason: "Atualização rápida de preço",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickEditProduct(null);
        loadProducts();
      } else {
        alert(data.error || "Erro ao atualizar preço");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Preço do Dia"
        subtitle="Fonte oficial dos preços utilizados no catálogo público iFindz"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner de Regra Fundamental */}
        {syncMessage && (
          <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-2xl p-4 flex items-center justify-between text-xs text-[#1b5e20] font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#34c759]" />
              <span>{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage(null)} className="text-[#1b5e20] hover:underline">
              Fechar
            </button>
          </div>
        )}

        <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 text-[#1b5e20]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Regra Oficial do Catálogo:</span> Apenas produtos{" "}
              <strong>Novos/Lacrados</strong> desta aba são exibidos no catálogo público. iPhones novos
              recebem automaticamente a margem de <strong>+R$ 200,00</strong> sobre o preço original.
              Seminovos nunca são publicados.
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {/* Botão Sincronizar Mundo Apple */}
            <button
              onClick={handleSyncMundoApple}
              disabled={syncingLive}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{syncingLive ? "Puxando do Mundo Apple..." : "⚡ Puxar Preço do Dia (Mundo Apple)"}</span>
            </button>

            {/* Botão Exportar */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#c8e6c9] hover:bg-[#f1f8e9] text-[#1b5e20] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Preço do Dia</span>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#e5e5ea] py-1 z-20">
                  <a
                    href="/api/export?format=xlsx"
                    download
                    onClick={() => setExportDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#34c759]" />
                    <span>Planilha Excel (.xlsx)</span>
                  </a>
                  <a
                    href="/api/export?format=csv"
                    download
                    onClick={() => setExportDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7]"
                  >
                    <FileText className="w-4 h-4 text-[#0071e3]" />
                    <span>Arquivo CSV (.csv)</span>
                  </a>
                  <a
                    href="/api/export?format=json"
                    download
                    onClick={() => setExportDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7]"
                  >
                    <FileCode className="w-4 h-4 text-[#ff9500]" />
                    <span>Arquivo JSON (.json)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Novo Produto */}
            <button
              onClick={() => {
                setProductToEdit(null);
                setFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-sm space-y-4">
          {/* Row 1: Search & Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca rápida (ex: 17 Pro Max, 256GB, Titânio)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] placeholder-[#86868b] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#86868b] bg-[#e8e8ed] px-1.5 py-0.5 rounded"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Quick condition toggles */}
            <div className="md:col-span-6 flex items-center gap-2 flex-wrap justify-start md:justify-end">
              <button
                onClick={() => {
                  setOnlyNovo(!onlyNovo);
                  if (!onlyNovo) setHideSeminovo(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  onlyNovo
                    ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-xs"
                    : "bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#e8e8ed]"
                }`}
              >
                ✓ Somente novos/lacrados
              </button>

              <button
                onClick={() => {
                  setHideSeminovo(!hideSeminovo);
                  if (!hideSeminovo) setOnlyNovo(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  hideSeminovo
                    ? "bg-[#e65100] text-white border-[#e65100] shadow-xs"
                    : "bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#e8e8ed]"
                }`}
              >
                🚫 Ocultar seminovos
              </button>
            </div>
          </div>

          {/* Row 2: Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#f5f5f7]">
            <div>
              <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
                Capacidade
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                <option value="all">Todas</option>
                {availableStorages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
                Condição
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                <option value="all">Todas</option>
                <option value="NOVO_LACRADO">Novo / Lacrado</option>
                <option value="SEMINOVO">Seminovo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <div className="text-xs text-[#86868b]">
              Exibindo <strong className="text-[#1d1d1f]">{filteredProducts.length}</strong> produtos
              configurados no Preço do Dia
            </div>
            <button
              onClick={loadProducts}
              className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors flex items-center gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                  <th className="py-3 px-4 font-semibold">Produto</th>
                  <th className="py-3 px-3 font-semibold">Categoria</th>
                  <th className="py-3 px-3 font-semibold">Condição</th>
                  <th className="py-3 px-3 font-semibold">Preço Original</th>
                  <th className="py-3 px-3 font-semibold">Margem</th>
                  <th className="py-3 px-3 font-semibold">Preço Final</th>
                  <th className="py-3 px-3 font-semibold">Catálogo Público</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#86868b]">
                      Carregando cotações do Preço do Dia...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#86868b]">
                      Nenhum produto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isPublished = p.condition === "NOVO_LACRADO" && p.active;
                    const isIphoneNovo =
                      p.category?.slug === "iphone" && p.condition === "NOVO_LACRADO";

                    return (
                      <tr key={p.id} className="hover:bg-[#fbfbfd] transition-colors">
                        {/* Produto */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1d1d1f]">{p.name}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#86868b] mt-0.5">
                            {p.storage && <span>{p.storage}</span>}
                            {p.ram && <span>• {p.ram}</span>}
                            {p.color && <span>• {p.color}</span>}
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-[#1d1d1f]">{p.category?.name}</span>
                          {p.subcategory && (
                            <div className="text-[10px] text-[#86868b]">
                              {p.subcategory.name}
                            </div>
                          )}
                        </td>

                        {/* Condição */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              p.condition === "NOVO_LACRADO"
                                ? "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]"
                                : "bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]"
                            }`}
                          >
                            {p.condition === "NOVO_LACRADO" ? "Novo Lacrado" : "Seminovo"}
                          </span>
                        </td>

                        {/* Preço Original */}
                        <td className="py-3.5 px-3 font-mono font-medium text-[#1d1d1f]">
                          <button
                            onClick={() => {
                              setQuickEditProduct(p);
                              setQuickNewPrice(String(p.originalPrice));
                            }}
                            className="hover:underline flex items-center gap-1 group text-left"
                            title="Clique para editar rapidamente este preço"
                          >
                            <span>{formatBRL(p.originalPrice)}</span>
                            <Edit2 className="w-3 h-3 text-[#86868b] opacity-0 group-hover:opacity-100" />
                          </button>
                        </td>

                        {/* Margem */}
                        <td className="py-3.5 px-3 font-mono">
                          {p.margin > 0 ? (
                            <span className="font-bold text-[#34c759]">
                              +{formatBRL(p.margin)}
                            </span>
                          ) : (
                            <span className="text-[#86868b]">R$ 0,00</span>
                          )}
                          {isIphoneNovo && (
                            <span className="block text-[9px] text-[#1b5e20] font-sans">
                              (Regra +200)
                            </span>
                          )}
                        </td>

                        {/* Preço Final */}
                        <td className="py-3.5 px-3 font-mono font-bold text-sm text-[#1d1d1f]">
                          {formatBRL(p.finalPrice)}
                        </td>

                        {/* Catálogo Público */}
                        <td className="py-3.5 px-3">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1b5e20]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                              <span>Publicado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#86868b]">
                              <AlertCircle className="w-3.5 h-3.5 text-[#ff9500]" />
                              <span>
                                {p.condition === "SEMINOVO"
                                  ? "Oculto (Seminovo)"
                                  : "Oculto (Inativo)"}
                              </span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                              p.active
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {p.active ? "Ativo" : "Inativo"}
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Histórico */}
                            <button
                              onClick={() => {
                                setSelectedProductForHistory(p);
                                setHistoryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] transition-colors"
                              title="Ver histórico de preços"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Duplicar */}
                            <button
                              onClick={() => handleDuplicate(p)}
                              className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                              title="Duplicar produto"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] transition-colors"
                              title="Editar produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 rounded-lg text-[#86868b] hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edição Rápida de Preço */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#e5e5ea]">
            <h3 className="text-base font-bold text-[#1d1d1f]">Atualizar Preço Original</h3>
            <p className="text-xs text-[#86868b] mt-0.5">{quickEditProduct.name}</p>

            <form onSubmit={handleSaveQuickPrice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Novo Preço Original / Fornecedor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  autoFocus
                  value={quickNewPrice}
                  onChange={(e) => setQuickNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-sm font-mono font-bold text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f5f5f7] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Preço original anterior:</span>
                  <span className="font-mono">{formatBRL(quickEditProduct.originalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Margem a aplicar:</span>
                  <span className="font-mono text-[#34c759]">+{formatBRL(quickEditProduct.margin)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#e5e5ea] font-bold">
                  <span>Novo preço final:</span>
                  <span className="font-mono text-[#1d1d1f]">
                    {formatBRL((parseFloat(quickNewPrice) || 0) + quickEditProduct.margin)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickSaving}
                  className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed]"
                >
                  {quickSaving ? "Salvando..." : "Atualizar e Recalcular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Formulário Completo */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={loadProducts}
        productToEdit={productToEdit}
        defaultSource="PRECO_DO_DIA"
      />

      {/* Modal de Histórico de Preços */}
      {selectedProductForHistory && (
        <PriceHistoryModal
          productId={selectedProductForHistory.id}
          productName={selectedProductForHistory.name}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedProductForHistory(null);
          }}
        />
      )}
    </div>
  );
}
