"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, AlertCircle, Sparkles, Smartphone, ShieldAlert } from "lucide-react";
import { calculateFinalPrice, formatBRL } from "@/lib/price-calculator";

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: { id: string; name: string; slug: string }[];
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit?: any | null;
  defaultSource?: "PRECO_DO_DIA" | "LOJA_FISICA";
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  productToEdit,
  defaultSource = "PRECO_DO_DIA",
}: ProductFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [model, setModel] = useState("");
  const [storage, setStorage] = useState("256GB");
  const [ram, setRam] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState<"NOVO_LACRADO" | "SEMINOVO">("NOVO_LACRADO");
  const [priceSource, setPriceSource] = useState<"PRECO_DO_DIA" | "LOJA_FISICA">(defaultSource);
  const [originalPrice, setOriginalPrice] = useState<number | string>("");
  const [active, setActive] = useState(true);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
          if (!categoryId && data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCats();
  }, []);

  // Preencher quando em modo de edição
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setCategoryId(productToEdit.categoryId || "");
      setSubcategoryId(productToEdit.subcategoryId || "");
      setModel(productToEdit.model || "");
      setStorage(productToEdit.storage || "");
      setRam(productToEdit.ram || "");
      setColor(productToEdit.color || "");
      setCondition(productToEdit.condition || "NOVO_LACRADO");
      setPriceSource(productToEdit.priceSource || defaultSource);
      setOriginalPrice(productToEdit.originalPrice || "");
      setActive(productToEdit.active !== undefined ? productToEdit.active : true);
      setReason("");
    } else {
      setName("");
      setModel("");
      setStorage("256GB");
      setRam("");
      setColor("");
      setCondition("NOVO_LACRADO");
      setPriceSource(defaultSource);
      setOriginalPrice("");
      setActive(true);
      setReason("");
    }
    setError(null);
  }, [productToEdit, isOpen, defaultSource]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  // Cálculo ao vivo da margem e preço final
  const liveCalculation = useMemo(() => {
    const parsed = typeof originalPrice === "number" ? originalPrice : parseFloat(originalPrice);
    const validPrice = isNaN(parsed) ? 0 : parsed;

    return calculateFinalPrice({
      categorySlug: selectedCategory?.slug,
      categoryName: selectedCategory?.name,
      condition,
      priceSource,
      originalPrice: validPrice,
    });
  }, [selectedCategory, condition, priceSource, originalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome do produto é obrigatório.");
      return;
    }
    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    const parsedPrice = parseFloat(String(originalPrice));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Informe um preço original válido e positivo.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        categoryId,
        subcategoryId: subcategoryId || null,
        model: model || name,
        storage: storage || null,
        ram: ram || null,
        color: color || null,
        condition,
        priceSource,
        originalPrice: parsedPrice,
        active,
        reason: reason.trim() || undefined,
      };

      const url = productToEdit ? `/api/products/${productToEdit.id}` : "/api/products";
      const method = productToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao salvar produto.");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-[#e5e5ea]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e5ea] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#1d1d1f]">
              {productToEdit ? "Editar Produto" : "Novo Produto Apple"}
            </h3>
            <p className="text-xs text-[#86868b]">
              Configure os detalhes e visualize o preço final calculado automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome e Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: iPhone 17 Pro Max 256GB"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Modelo / Referência
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: iPhone 17 Pro Max"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria e Subcategoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Categoria Apple *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Subcategoria
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              >
                <option value="">Nenhuma / Geral</option>
                {selectedCategory?.subcategories?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacidade, RAM, Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Capacidade / Storage
              </label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="ex: 128GB, 256GB, 512GB, 1TB"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                RAM (se aplicável)
              </label>
              <input
                type="text"
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                placeholder="ex: 8GB, 16GB, 24GB"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Cor
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="ex: Titânio Natural, Preto"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          {/* Fonte de Preço e Condição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f9f9fb] border border-[#e5e5ea]">
            <div>
              <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                Fonte de Preço *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriceSource("PRECO_DO_DIA")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    priceSource === "PRECO_DO_DIA"
                      ? "bg-[#0071e3] text-white border-[#0071e3] shadow-sm"
                      : "bg-white text-[#1d1d1f] border-[#d2d2d7]"
                  }`}
                >
                  Preço do Dia
                </button>
                <button
                  type="button"
                  onClick={() => setPriceSource("LOJA_FISICA")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    priceSource === "LOJA_FISICA"
                      ? "bg-[#4a148c] text-white border-[#4a148c] shadow-sm"
                      : "bg-white text-[#1d1d1f] border-[#d2d2d7]"
                  }`}
                >
                  Loja Física
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[#86868b]">
                {priceSource === "PRECO_DO_DIA"
                  ? "✓ Fonte oficial para catálogo público (quando Novo/Lacrado)"
                  : "⚠ Totalmente isolado do catálogo público"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                Condição do Produto *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition("NOVO_LACRADO")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    condition === "NOVO_LACRADO"
                      ? "bg-[#1b5e20] text-white border-[#1b5e20] shadow-sm"
                      : "bg-white text-[#1d1d1f] border-[#d2d2d7]"
                  }`}
                >
                  Novo / Lacrado
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("SEMINOVO")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    condition === "SEMINOVO"
                      ? "bg-[#e65100] text-white border-[#e65100] shadow-sm"
                      : "bg-white text-[#1d1d1f] border-[#d2d2d7]"
                  }`}
                >
                  Seminovo
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[#86868b]">
                {condition === "NOVO_LACRADO"
                  ? "✓ Elegível para catálogo oficial (se Preço do Dia)"
                  : "🚫 Seminovos NUNCA aparecem no catálogo"}
              </p>
            </div>
          </div>

          {/* Preço Original / Custo */}
          <div>
            <label className="block text-xs font-bold text-[#1d1d1f] mb-1">
              Preço Original / Fornecedor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#86868b]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="ex: 7550.00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f5f7] text-sm font-mono font-bold text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          {/* Card de Cálculo Automático de Margem & Preço Final */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] border border-[#d2d2d7]/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
                Cálculo de Preço em Tempo Real
              </span>
              <span className="text-[10px] font-mono text-[#86868b]">
                Fórmula: Preço Final = Original + Margem
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#d2d2d7]/50 text-center">
              <div>
                <div className="text-[10px] text-[#86868b]">Preço Original</div>
                <div className="font-mono text-xs font-semibold text-[#1d1d1f]">
                  {formatBRL(liveCalculation.originalPrice)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#86868b]">Margem Aplicada</div>
                <div
                  className={`font-mono text-xs font-bold ${
                    liveCalculation.margin > 0 ? "text-[#34c759]" : "text-[#86868b]"
                  }`}
                >
                  +{formatBRL(liveCalculation.margin)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#86868b]">Preço Final</div>
                <div className="font-mono text-sm font-bold text-[#1d1d1f]">
                  {formatBRL(liveCalculation.finalPrice)}
                </div>
              </div>
            </div>

            {/* Aviso explicativo das regras */}
            <div className="pt-2 text-[11px] leading-tight">
              {liveCalculation.isIphoneEligibleForAutoMargin ? (
                <div className="text-[#1b5e20] flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Regra iPhone Novo aplicada automaticamente (+R$ 200,00).</span>
                </div>
              ) : condition === "SEMINOVO" ? (
                <div className="text-[#e65100] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Produto seminovo: sem margem de +R$ 200 e excluído do catálogo.</span>
                </div>
              ) : priceSource === "LOJA_FISICA" ? (
                <div className="text-[#4a148c] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Loja Física: preço isolado, não recebe margem de iPhone nem vai ao catálogo.</span>
                </div>
              ) : (
                <div className="text-[#86868b] flex items-center gap-1">
                  <span>Preço original cadastrado mantido (categoria sem margem automática).</span>
                </div>
              )}
            </div>
          </div>

          {/* Motivo da alteração (se editando) */}
          {productToEdit && (
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Motivo da Atualização (para histórico)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex: Atualização de cotação do fornecedor"
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          )}

          {/* Status Ativo */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="product-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3]"
            />
            <label htmlFor="product-active" className="text-xs font-medium text-[#1d1d1f]">
              Produto Ativo no Sistema
            </label>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-[#fbfbfd] border-t border-[#e5e5ea] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? "Salvando..." : productToEdit ? "Salvar Alterações" : "Cadastrar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
