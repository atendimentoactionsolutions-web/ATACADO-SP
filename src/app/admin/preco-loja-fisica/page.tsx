"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/AdminHeader";
import ProductFormModal from "@/components/ProductFormModal";
import PriceHistoryModal from "@/components/PriceHistoryModal";
import {
  Search,
  Plus,
  Store,
  ShieldAlert,
  Edit2,
  Trash2,
  History,
  Copy,
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

export default function PrecoLojaFisicaAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products?source=LOJA_FISICA");
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
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
      if (search.trim() !== "") {
        const term = search.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(term);
        const mModel = p.model.toLowerCase().includes(term);
        const mColor = p.color ? p.color.toLowerCase().includes(term) : false;
        if (!mName && !mModel && !mColor) return false;
      }
      return true;
    });
  }, [products, search]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Remover "${product.name}" da Loja Física?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Preço Loja Física"
        subtitle="Gestão isolada de preços de balcão para loja física"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner de Isolamento Rigoroso */}
        <div className="bg-[#ede7f6] border border-[#d1c4e9] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3 text-[#4a148c]">
            <Store className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">Área Totalmente Isolada: Preço Loja Física</div>
              <p className="mt-0.5 text-[#4a148c]/80 leading-relaxed">
                Estes preços são exclusivos para balcão e atendimento presencial. Eles{" "}
                <strong>NUNCA</strong> entram no catálogo público do Preço do Dia e{" "}
                <strong>NÃO RECEBEM</strong> a margem automática de +R$ 200 de iPhones.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setProductToEdit(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#4a148c] hover:bg-[#38006b] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Preço Loja Física</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl p-4 border border-[#e5e5ea] shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos cadastrados na Loja Física..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] placeholder-[#86868b] border border-transparent focus:border-[#4a148c] focus:outline-none"
            />
          </div>

          <button
            onClick={loadProducts}
            className="p-2 rounded-xl text-[#86868b] hover:bg-[#f5f5f7] transition-colors flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
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
                  <th className="py-3 px-3 font-semibold">Preço Loja Física</th>
                  <th className="py-3 px-3 font-semibold">Status do Isolamento</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#86868b]">
                      Carregando produtos da Loja Física...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#86868b]">
                      Nenhum produto cadastrado especificamente para Loja Física.
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

                      <td className="py-3.5 px-3 font-mono font-bold text-sm text-[#4a148c]">
                        {formatBRL(p.finalPrice)}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ede7f6] text-[#4a148c] border border-[#d1c4e9]">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Isolado do Catálogo Online</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProductForHistory(p);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7]"
                            title="Histórico"
                          >
                            <History className="w-4 h-4" />
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
        defaultSource="LOJA_FISICA"
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
