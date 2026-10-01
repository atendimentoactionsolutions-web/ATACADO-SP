"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Headphones,
  Cable,
  Tag,
} from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order: number;
  subcategories: Subcategory[];
  _count?: { products: number };
}

const ICONS: Record<string, any> = {
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Headphones,
  Cable,
  Tag,
};

export default function CategoriasAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal nova categoria
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("Tag");

  // Modal nova subcategoria
  const [newSubModalOpen, setNewSubModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [subName, setSubName] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, icon: catIcon }),
      });
      const data = await res.json();
      if (data.success) {
        setCatName("");
        setNewCatModalOpen(false);
        loadCategories();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedCatId) return;

    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: selectedCatId, name: subName }),
      });
      const data = await res.json();
      if (data.success) {
        setSubName("");
        setNewSubModalOpen(false);
        loadCategories();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubcategory = async (subId: string, name: string) => {
    if (!confirm(`Excluir a subcategoria "${name}"?`)) return;
    try {
      const res = await fetch(`/api/subcategories?id=${subId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) loadCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Excluir a categoria "${cat.name}"? Não pode conter produtos vinculados.`))
      return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadCategories();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Gestão de Categorias e Subcategorias"
        subtitle="Organização dinâmica do catálogo de produtos Apple"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#86868b]">
              Estrutura flexível para classificação e filtros no catálogo
            </span>
          </div>

          <button
            onClick={() => setNewCatModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon || "Tag"] || Tag;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-[#f5f5f7] pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1d1d1f] flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.slug === "iphone" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b5e20] font-semibold border border-[#c8e6c9]">
                              Regra +R$ 200 ativa
                            </span>
                          )}
                        </h3>
                        <div className="text-[11px] text-[#86868b]">
                          {cat._count?.products || 0} produtos cadastrados
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          setNewSubModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#0071e3] hover:bg-[#0071e3]/10 text-xs font-medium flex items-center gap-1"
                        title="Adicionar subcategoria"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Subcategoria</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-red-600 hover:bg-red-50"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Pills */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-2">
                      Subcategorias / Modelos
                    </div>
                    {cat.subcategories.length === 0 ? (
                      <div className="text-xs text-[#86868b] italic py-2">
                        Nenhuma subcategoria cadastrada ainda.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cat.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-medium text-[#1d1d1f] group"
                          >
                            <span>{sub.name}</span>
                            <button
                              onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                              className="text-[#86868b] hover:text-red-600 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
                              title="Remover subcategoria"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nova Categoria */}
      {newCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#e5e5ea]">
            <h3 className="text-base font-bold text-[#1d1d1f]">Criar Nova Categoria Apple</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              Ex: Acessórios Vision Pro, Cabos Thunderbolt, etc.
            </p>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="ex: Apple Vision"
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Ícone Representativo
                </label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                >
                  <option value="Smartphone">Smartphone (iPhone)</option>
                  <option value="Tablet">Tablet (iPad)</option>
                  <option value="Laptop">Laptop (Mac)</option>
                  <option value="Watch">Watch (Relógio)</option>
                  <option value="Headphones">Headphones (AirPods)</option>
                  <option value="Cable">Cable (Cabos e Carregadores)</option>
                  <option value="Tag">Tag (Geral)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCatModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed]"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Subcategoria */}
      {newSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#e5e5ea]">
            <h3 className="text-base font-bold text-[#1d1d1f]">Criar Nova Subcategoria</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              Adicione um modelo à categoria selecionada
            </p>

            <form onSubmit={handleCreateSubcategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Nome da Subcategoria *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="ex: iPhone 18 Ultra"
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSubModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed]"
                >
                  Adicionar Subcategoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
