"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Headphones,
  PenTool,
  Monitor,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  MessageCircle,
  Eye,
  Shield,
  Zap,
} from "lucide-react";
import { formatBRL } from "@/lib/price-calculator";

interface Product {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  subcategory: string | null;
  model: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  condition: string;
  conditionLabel: string;
  price: number;
  priceSource: string;
  active: boolean;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface ProductVariant {
  id: string;
  name: string;
  color: string | null;
  price: number;
}

interface GroupedCard {
  key: string;
  categorySlug: string;
  modelTitle: string;
  storage: string | null;
  ram: string | null;
  variants: ProductVariant[];
  minPrice: number;
}

interface ModelSection {
  modelTitle: string;
  categorySlug: string;
  cards: GroupedCard[];
}

const CATEGORY_ICONS: Record<string, any> = {
  iphone: Smartphone,
  ipad: Tablet,
  mac: Laptop,
  imac: Monitor,
  "apple-watch": Watch,
  airpods: Headphones,
  acessorios: PenTool,
};

// Mapeamento visual das cores para a bolinha circular
function getColorDotStyle(colorName: string | null): { bg: string; border: string } {
  if (!colorName) return { bg: "#94a3b8", border: "#cbd5e1" };
  const c = colorName.toUpperCase();

  if (c.includes("SILVER") || c.includes("PRATEADO") || c.includes("STARLIGHT") || c.includes("ESTELAR") || c.includes("WHITE TITANIUM")) {
    return { bg: "#e2e8f0", border: "#cbd5e1" };
  }
  if (c.includes("SPACE BLACK") || c.includes("PRETO ESPACIAL") || c.includes("JET BLACK") || c.includes("BLACK TITANIUM")) {
    return { bg: "#18181b", border: "#27272a" };
  }
  if (c.includes("BLACK") || c.includes("PRETO") || c.includes("MIDNIGHT") || c.includes("MEIA-NOITE") || c.includes("CHARCOAL")) {
    return { bg: "#09090b", border: "#18181b" };
  }
  if (c.includes("SPACE GRAY") || c.includes("CINZA-ESPACIAL") || c.includes("CINZA") || c.includes("GRAPHITE")) {
    return { bg: "#64748b", border: "#475569" };
  }
  if (c.includes("GLACIER") || c.includes("CLOUD WHITE") || c.includes("WHITE") || c.includes("BRANCO")) {
    return { bg: "#f8fafc", border: "#cbd5e1" };
  }
  if (c.includes("BURGUNDY") || c.includes("VINHO") || c.includes("VERMELHO") || c.includes("RED")) {
    return { bg: "#831843", border: "#701a75" };
  }
  if (c.includes("COSMIC ORANGE") || c.includes("ORANGE") || c.includes("LARANJA")) {
    return { bg: "#ea580c", border: "#c2410c" };
  }
  if (c.includes("CITRUS")) {
    return { bg: "#f59e0b", border: "#d97706" };
  }
  if (c.includes("INDIGO") || c.includes("DEEP BLUE") || c.includes("BLUE TITANIUM")) {
    return { bg: "#1e3a8a", border: "#172554" };
  }
  if (c.includes("BLUE") || c.includes("AZUL") || c.includes("NAVY")) {
    return { bg: "#2563eb", border: "#1d4ed8" };
  }
  if (c.includes("MIST BLUE") || c.includes("SKY BLUE")) {
    return { bg: "#7dd3fc", border: "#38bdf8" };
  }
  if (c.includes("ULTRAMARINE") || c.includes("ULTRAMARINO")) {
    return { bg: "#3b82f6", border: "#2563eb" };
  }
  if (c.includes("SOFT PINK") || c.includes("BLUSH") || c.includes("PINK") || c.includes("ROSA") || c.includes("ROSE GOLD")) {
    return { bg: "#f472b6", border: "#db2777" };
  }
  if (c.includes("DEEP PURPLE") || c.includes("PURPLE") || c.includes("ROXO") || c.includes("LAVENDER")) {
    return { bg: "#a855f7", border: "#9333ea" };
  }
  if (c.includes("ALPINE GREEN") || c.includes("TEAL") || c.includes("VERDE") || c.includes("GREEN") || c.includes("SAGE")) {
    return { bg: "#10b981", border: "#059669" };
  }
  if (c.includes("LIGHT GOLD") || c.includes("GOLD") || c.includes("DOURADO") || c.includes("AMARELO") || c.includes("YELLOW")) {
    return { bg: "#eab308", border: "#ca8a04" };
  }
  if (c.includes("NATURAL TITANIUM") || c.includes("NATURAL") || c.includes("TITANIO")) {
    return { bg: "#9ca3af", border: "#6b7280" };
  }
  if (c.includes("DESERT TITANIUM") || c.includes("DESERT") || c.includes("DESERTO")) {
    return { bg: "#d4a373", border: "#bc6c25" };
  }

  return { bg: "#94a3b8", border: "#64748b" };
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("iphone");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("default");
  const [selectedStorage, setSelectedStorage] = useState<string>("all");

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/catalog/preco-do-dia");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
    const interval = setInterval(loadCatalog, 15000);
    return () => clearInterval(interval);
  }, []);

  // Storages disponíveis
  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.storage) set.add(p.storage);
    });
    return Array.from(set).sort();
  }, [products]);

  // Agrupamento de produtos em cards por Modelo + Capacidade + RAM
  const groupedCards = useMemo(() => {
    const filtered = products.filter((p) => {
      // Categoria
      if (selectedCategory !== "all" && p.categorySlug !== selectedCategory) {
        return false;
      }
      // Capacidade
      if (selectedStorage !== "all" && p.storage !== selectedStorage) {
        return false;
      }
      // Busca
      if (search.trim() !== "") {
        const term = search.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(term);
        const matchModel = p.model.toLowerCase().includes(term);
        const matchColor = p.color ? p.color.toLowerCase().includes(term) : false;
        const matchStorage = p.storage ? p.storage.toLowerCase().includes(term) : false;
        if (!matchName && !matchModel && !matchColor && !matchStorage) {
          return false;
        }
      }
      return true;
    });

    const groupsMap = new Map<string, GroupedCard>();

    filtered.forEach((p) => {
      let modelTitle = (p.model || p.name).trim().toUpperCase();

      // RAM existe e é exibida EXCLUSIVAMENTE para Mac/MacBooks (p.categorySlug === "mac")
      let extractedRam: string | null = null;
      if (p.categorySlug === "mac") {
        extractedRam = p.ram ? p.ram.trim() : null;
        if (!extractedRam) {
          const ramMatch = p.name.match(/(\d+\s*GB)\s+(RAM|MEMORIA|MEMÓRIA)/i) || 
                           p.name.match(/\b(8GB|16GB|18GB|24GB|32GB|36GB|48GB|64GB|96GB|128GB)\b/i);
          if (ramMatch) {
            extractedRam = ramMatch[1].toUpperCase();
            if (p.storage && extractedRam.toUpperCase() === p.storage.toUpperCase() && !p.name.includes("RAM")) {
              extractedRam = null;
            }
          }
        }
      }

      // Normalizar modelo removendo o storage e RAM do título limpo
      if (p.storage) {
        const storageClean = p.storage.toUpperCase();
        modelTitle = modelTitle.replace(new RegExp(`\\s+${storageClean}$`, "i"), "").trim();
      }
      if (extractedRam) {
        const ramClean = extractedRam.toUpperCase();
        modelTitle = modelTitle.replace(new RegExp(`\\s+${ramClean}\\s*(RAM)?$`, "i"), "").trim();
      }

      const storage = p.storage ? p.storage.trim() : null;
      const ram = extractedRam;
      const key = `${p.categorySlug}___${modelTitle}___${storage || "NONE"}___${ram || "NONE"}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          categorySlug: p.categorySlug,
          modelTitle,
          storage,
          ram,
          variants: [],
          minPrice: p.price,
        });
      }

      const group = groupsMap.get(key)!;
      const colorClean = (p.color || "PADRÃO").trim().toUpperCase();
      const exists = group.variants.find(
        (v) => (v.color || "PADRÃO").trim().toUpperCase() === colorClean
      );

      if (!exists) {
        group.variants.push({
          id: p.id,
          name: p.name,
          color: p.color ? p.color.trim().toUpperCase() : null,
          price: p.price,
        });
      } else if (p.price < exists.price) {
        exists.price = p.price;
        exists.id = p.id;
      }

      if (p.price < group.minPrice) {
        group.minPrice = p.price;
      }
    });

    // Ordenar variantes dentro de cada card por preço crescente
    groupsMap.forEach((group) => {
      group.variants.sort((a, b) => a.price - b.price);
    });

    const list = Array.from(groupsMap.values());

    // Função para extrair peso/número do modelo para ordenação (mais recente primeiro)
    const getModelWeight = (title: string) => {
      const match = title.match(/(\d+)/);
      if (match) {
        let num = parseInt(match[1], 10);
        // Ajuste fino para linhas Pro/Max virem acima dentro do mesmo número
        if (title.includes("PRO MAX")) num += 0.3;
        else if (title.includes("PRO")) num += 0.2;
        else if (title.includes("AIR")) num += 0.1;
        return num;
      }
      return 0;
    };

    // Ordenar cards por capacidade dentro do mesmo modelo
    const parseStorageSize = (s: string | null) => {
      if (!s) return 0;
      if (s.includes("TB")) return parseFloat(s) * 1024;
      if (s.includes("GB")) return parseFloat(s);
      return 0;
    };

    // Agrupar cards por modelo para criar linhas separadas
    const sectionsMap = new Map<string, ModelSection>();

    list.forEach((card) => {
      const sectionKey = `${card.categorySlug}___${card.modelTitle}`;
      if (!sectionsMap.has(sectionKey)) {
        sectionsMap.set(sectionKey, {
          modelTitle: card.modelTitle,
          categorySlug: card.categorySlug,
          cards: [],
        });
      }
      sectionsMap.get(sectionKey)!.cards.push(card);
    });

    const sections = Array.from(sectionsMap.values());

    // Dentro de cada seção de modelo, ordenar as capacidades em ordem crescente (256GB, 512GB, 1TB, 2TB)
    sections.forEach((sec) => {
      sec.cards.sort((a, b) => {
        const sizeA = parseStorageSize(a.storage);
        const sizeB = parseStorageSize(b.storage);
        if (sizeA !== sizeB) return sizeA - sizeB;
        return a.minPrice - b.minPrice;
      });
    });

    // Ordenação das linhas de modelo
    if (sort === "price-asc") {
      sections.sort((a, b) => (a.cards[0]?.minPrice || 0) - (b.cards[0]?.minPrice || 0));
    } else if (sort === "price-desc") {
      sections.sort((a, b) => (b.cards[0]?.minPrice || 0) - (a.cards[0]?.minPrice || 0));
    } else if (sort === "name") {
      sections.sort((a, b) => a.modelTitle.localeCompare(b.modelTitle));
    } else {
      // Padrão: Mais recentes primeiro (18 Pro Max, 18 Pro, 17 Pro Max, 17 Pro, etc.)
      sections.sort((a, b) => {
        const weightA = getModelWeight(a.modelTitle);
        const weightB = getModelWeight(b.modelTitle);
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        return a.modelTitle.localeCompare(b.modelTitle);
      });
    }

    return sections;
  }, [products, selectedCategory, selectedStorage, search, sort]);

  const generateWhatsAppLink = (variant: ProductVariant, group: GroupedCard) => {
    const colorText = variant.color ? ` - Cor: ${variant.color}` : "";
    const storageText = group.storage ? ` (${group.storage})` : "";
    const ramText = group.ram ? ` [${group.ram} RAM]` : "";
    const text = encodeURIComponent(
      `Olá ATACADO SP! Tenho interesse no *${group.modelTitle}${storageText}${ramText}*${colorText} por *${formatBRL(
        variant.price
      )}* anunciado no Preço do Dia oficial.\n\n*Condição:* Pagamento Somente à Vista\n*Retirada/Localização:* Santa Efigênia - SP`
    );
    return `https://wa.me/5511930089729?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Category Pills Bar */}
        <div className="grid grid-cols-3 sm:flex sm:items-center sm:overflow-x-auto gap-2 sm:gap-2.5 mb-5">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug] || Smartphone;
            const isSelected = selectedCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-2xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all sm:shrink-0 border ${
                  isSelected
                    ? "bg-[#0b101b] text-white border-[#0b101b] shadow-sm"
                    : "bg-white text-[#334155] border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? "text-white" : "text-[#475569]"}`} />
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e2e8f0] mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por modelo, cor ou capacidade (ex: 17 Pro Max, Cosmic Orange, 256GB)..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#f8fafc] text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 border border-transparent focus:border-[#0071e3]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-[#0f172a] bg-[#e2e8f0] px-2 py-1 rounded-md font-medium"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-[#e2e8f0] animate-pulse space-y-4 shadow-sm"
              >
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-5 bg-emerald-100 rounded w-1/4" />
                <div className="space-y-2 pt-2">
                  <div className="h-8 bg-gray-100 rounded w-full" />
                  <div className="h-8 bg-gray-100 rounded w-full" />
                  <div className="h-8 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedCards.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#e2e8f0] max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center mx-auto mb-4 text-[#94a3b8]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Tente ajustar sua busca ou selecionar outra categoria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedStorage("all");
                setSearch("");
              }}
              className="mt-4 px-4 py-2 rounded-full bg-[#0b101b] text-white text-xs font-semibold hover:bg-[#1e293b]"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          /* Cards agrupados com divisão por modelos através de espaçamento (Linha 18 Pro Max, Linha 18 Pro, etc.) */
          <div className="space-y-8">
            {groupedCards.map((section) => (
              <div key={`${section.categorySlug}___${section.modelTitle}`} className="w-full">
                {/* Grid de capacidades do modelo (ex: 256GB, 512GB, 1TB, 2TB) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                  {section.cards.map((group) => (
                    <div
                      key={group.key}
                      className="bg-white rounded-2xl p-5 border border-[#e2e8f0] hover:border-[#cbd5e1] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Bar: Title */}
                        <div>
                          <h3 className="text-[13px] font-extrabold uppercase tracking-tight text-[#0f172a] leading-tight">
                            {group.modelTitle}
                          </h3>
                        </div>

                        {/* Tags Bar: RAM (apenas para Mac/MacBook) & Storage */}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          {group.categorySlug === "mac" && group.ram && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
                              <span className="w-2.5 h-2 rounded-[2px] border border-current" />
                              <span>{group.ram.includes("RAM") ? group.ram : `${group.ram} RAM`}</span>
                            </span>
                          )}

                          {group.storage && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                              {group.storage}
                            </span>
                          )}
                        </div>

                        {/* Variants List (Colors + Prices) */}
                        <div className="mt-4 divide-y divide-[#f1f5f9]">
                          {group.variants.map((variant) => {
                            const dot = getColorDotStyle(variant.color);
                            const link = generateWhatsAppLink(variant, group);

                            return (
                              <a
                                key={variant.id}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Clique para comprar no WhatsApp"
                                className="py-2.5 flex items-center justify-between gap-2 group/row hover:bg-[#f8fafc] -mx-2 px-2 rounded-lg transition-colors"
                              >
                                {/* Left: Dot + Color Name */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border"
                                    style={{
                                      backgroundColor: dot.bg,
                                      borderColor: dot.border,
                                    }}
                                  />
                                  <span className="text-[11px] font-bold uppercase tracking-tight text-[#334155] group-hover/row:text-[#0f172a] truncate">
                                    {variant.color || "PADRÃO"}
                                  </span>
                                </div>

                                {/* Right: Price & WhatsApp Icon */}
                                <div className="flex items-center gap-1.5 shrink-0 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-bold uppercase text-[#94a3b8] -mb-1 leading-tight">
                                      À VISTA
                                    </span>
                                    <span className="text-[13px] font-extrabold text-[#16a34a] tracking-tight">
                                      {formatBRL(variant.price)}
                                    </span>
                                  </div>

                                  <span className="w-6 h-6 rounded-lg bg-[#25d366]/10 border border-[#25d366]/30 text-[#16a34a] flex items-center justify-center group-hover/row:scale-110 group-hover/row:bg-[#25d366] group-hover/row:text-white transition-all shadow-2xs">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Highlights */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0f172a]">Garantia Oficial Apple</h4>
              <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
                Todos os produtos são 100% lacrados de fábrica com 1 ano de garantia global válida em qualquer Apple Store.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#16a34a]/10 text-[#16a34a] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0f172a]">Cotação Oficial Diária</h4>
              <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
                Preços ajustados em tempo real de acordo com as melhores condições de importação e distribuição.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0f172a]">Atendimento Especializado</h4>
              <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
                Consultores dedicados para tirar dúvidas sobre modelos, cores, capacidades e pronta entrega.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-10 mt-16 text-center text-xs text-[#64748b]">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-semibold text-[#0f172a]">ATACADO SP</span>
            <span>• Especialista Apple</span>
            <span className="hidden sm:inline">•</span>
            <span>📍 Santa Efigênia - SP</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium text-[#16a34a]">Pagamento Somente à Vista</span>
          </div>

          <div>
            Preço do Dia Oficial. Todos os direitos reservados. Apple é marca registrada da Apple Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
