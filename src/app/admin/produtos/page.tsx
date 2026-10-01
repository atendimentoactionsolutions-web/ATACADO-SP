"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/AdminHeader";
import ProductFormModal from "@/components/ProductFormModal";
import PriceHistoryModal from "@/components/PriceHistoryModal";
import {
  Search,
  Plus,
  Filter,
  Copy,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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

export default function ProdutosAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedSource !== "all" && p.priceSource !== selectedSource) return false;
      if (selectedCondition !== "all" && p.condition !== selectedCondition) return false;
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;

      if (search.trim() !== "") {
        const term = search.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(term);
        const mModel = p.model.toLowerCase().includes(term);
        const mColor = p.color ? p.color.toLowerCase().includes(term) : false;
        if (!mName && !mModel && !mColor) return false;
      }

      return true;
    });
  }, [products, selectedSource, selectedCondition, selectedCategory, search]);

  const handleDuplicate = async (product: Product) => {
    if (!confirm(`Duplicar produto "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Excluir permanentemente "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Catálogo Geral de Produtos"
        subtitle="Visualização consolidada de todo o estoque cadastrado na iFindz"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#86868b]">
              Total no sistema: <strong className="text-[#1d1d1f]">{products.length}</strong> produtos
            </span>
          </div>

          <button
            onClick={() => {
              setProductToEdit(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors text-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Produto</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
              Busca
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1">
              Fonte do Preço
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
            >
              <option value="all">Todas as Fontes</option>
              <option value="PRECO_DO_DIA">Preço do Dia</option>
              <option value="LOJA_FISICA">Loja Física</option>
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
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                  <th className="py-3 px-4 font-semibold">Produto</th>
                  <th className="py-3 px-3 font-semibold">Categoria</th>
                  <th className="py-3 px-3 font-semibold">Condição</th>
                  <th className="py-3 px-3 font-semibold">Fonte</th>
                  <th className="py-3 px-3 font-semibold">Preço Original</th>
                  <th className="py-3 px-3 font-semibold">Margem</th>
                  <th className="py-3 px-3 font-semibold">Preço Final</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#86868b]">
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#86868b]">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fbfbfd] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1d1d1f]">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-[#86868b]">
                          {p.storage} {p.color ? `• ${p.color}` : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[#1d1d1f]">{p.category?.name}</td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            p.condition === "NOVO_LACRADO"
                              ? "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]"
                              : "bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]"
                          }`}
                        >
                          {p.condition === "NOVO_LACRADO" ? "Novo Lacrado" : "Seminovo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            p.priceSource === "PRECO_DO_DIA"
                              ? "bg-[#e3f2fd] text-[#0d47a1]"
                              : "bg-[#ede7f6] text-[#4a148c]"
                          }`}
                        >
                          {p.priceSource === "PRECO_DO_DIA" ? "Preço do Dia" : "Loja Física"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#86868b]">
                        {formatBRL(p.originalPrice)}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[#34c759] font-bold">
                        +{formatBRL(p.margin)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-sm text-[#1d1d1f]">
                        {formatBRL(p.finalPrice)}
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                            p.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProductForHistory(p);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7]"
                            title="Histórico de Preços"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7]"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-red-600 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={loadProducts}
        productToEdit={productToEdit}
      />

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
