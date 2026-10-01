"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import {
  Settings,
  Sparkles,
  Save,
  CheckCircle2,
  DollarSign,
  Calculator,
  MessageCircle,
  Store,
  FileText,
} from "lucide-react";

export default function ConfiguracoesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [iphoneMargin, setIphoneMargin] = useState("200");
  const [roundingMode, setRoundingMode] = useState("EXACT");
  const [storeName, setStoreName] = useState("iFindz");
  const [whatsappNumber, setWhatsappNumber] = useState("5511999999999");
  const [catalogNotice, setCatalogNotice] = useState(
    "Preços atualizados diariamente. Produtos 100% originais Apple lacrados com 1 ano de garantia."
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          if (data.settings.iphone_margin) setIphoneMargin(data.settings.iphone_margin);
          if (data.settings.rounding_mode) setRoundingMode(data.settings.rounding_mode);
          if (data.settings.store_name) setStoreName(data.settings.store_name);
          if (data.settings.whatsapp_number) setWhatsappNumber(data.settings.whatsapp_number);
          if (data.settings.catalog_notice) setCatalogNotice(data.settings.catalog_notice);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iphone_margin: iphoneMargin,
          rounding_mode: roundingMode,
          store_name: storeName,
          whatsapp_number: whatsappNumber,
          catalog_notice: catalogNotice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Configurações do Sistema"
        subtitle="Regras de margem, arredondamento e dados da loja"
      />

      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-[#e8f5e9] border border-[#c8e6c9] text-xs text-[#1b5e20] flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#34c759]" />
            <span>Configurações salvas e aplicadas com sucesso em todo o sistema!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Regra de Margem do iPhone */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[#1d1d1f] border-b border-[#f5f5f7] pb-3">
              <DollarSign className="w-4 h-4 text-[#0071e3]" />
              <span>Regra Especial dos iPhones Novos (Preço do Dia)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Margem Automática Obrigatória (R$)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#86868b]">
                  R$
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={iphoneMargin}
                  onChange={(e) => setIphoneMargin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f5f7] text-sm font-mono font-bold text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#86868b] leading-relaxed">
                Valor adicionado automaticamente ao preço original quando o produto pertencer à categoria
                <strong> iPhone</strong>, estiver como <strong>NOVO_LACRADO</strong> e pertencer ao{" "}
                <strong>Preço do Dia</strong>. Não é aplicado a seminovos, nem a produtos da Loja Física, nem acumulado.
              </p>
            </div>
          </div>

          {/* Card 2: Regra de Arredondamento (Seção 13) */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[#1d1d1f] border-b border-[#f5f5f7] pb-3">
              <Calculator className="w-4 h-4 text-[#ff9500]" />
              <span>Política de Arredondamento de Preços</span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#1d1d1f]">
                Modo de Arredondamento no Cálculo Final:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    roundingMode === "EXACT"
                      ? "bg-[#0071e3]/5 border-[#0071e3] text-[#1d1d1f]"
                      : "bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Valor Exato (Padrão)</span>
                    <input
                      type="radio"
                      name="rounding"
                      value="EXACT"
                      checked={roundingMode === "EXACT"}
                      onChange={(e) => setRoundingMode(e.target.value)}
                    />
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    Mantém o valor exato calculado pela fórmula: Preço Original + Margem.
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    roundingMode === "ROUND_UP_10"
                      ? "bg-[#0071e3]/5 border-[#0071e3] text-[#1d1d1f]"
                      : "bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Múltiplo de 10 para Cima</span>
                    <input
                      type="radio"
                      name="rounding"
                      value="ROUND_UP_10"
                      checked={roundingMode === "ROUND_UP_10"}
                      onChange={(e) => setRoundingMode(e.target.value)}
                    />
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    Exemplo: R$ 7.749 → R$ 7.750, R$ 7.741 → R$ 7.750.
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    roundingMode === "ROUND_90"
                      ? "bg-[#0071e3]/5 border-[#0071e3] text-[#1d1d1f]"
                      : "bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Terminar em R$ ...90</span>
                    <input
                      type="radio"
                      name="rounding"
                      value="ROUND_90"
                      checked={roundingMode === "ROUND_90"}
                      onChange={(e) => setRoundingMode(e.target.value)}
                    />
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    Arredonda comercialmente para finalizar em 90 (ex: R$ 7.750 → R$ 7.790).
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    roundingMode === "ROUND_99"
                      ? "bg-[#0071e3]/5 border-[#0071e3] text-[#1d1d1f]"
                      : "bg-[#f5f5f7] border-[#e5e5ea] text-[#86868b]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Terminar em R$ ...99</span>
                    <input
                      type="radio"
                      name="rounding"
                      value="ROUND_99"
                      checked={roundingMode === "ROUND_99"}
                      onChange={(e) => setRoundingMode(e.target.value)}
                    />
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    Arredonda comercialmente para finalizar em 99 (ex: R$ 7.750 → R$ 7.799).
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Dados de Atendimento e Loja */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[#1d1d1f] border-b border-[#f5f5f7] pb-3">
              <Store className="w-4 h-4 text-[#34c759]" />
              <span>Informações da Loja e Contato Comercial</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  WhatsApp para Pedidos do Catálogo
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="5511999999999"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Aviso / Disclaimer do Catálogo Público
              </label>
              <textarea
                rows={2}
                value={catalogNotice}
                onChange={(e) => setCatalogNotice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Configurações"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
