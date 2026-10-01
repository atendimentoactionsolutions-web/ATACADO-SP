"use client";

import { useEffect, useState } from "react";
import { X, History, ArrowRight, User, Calendar, Clock } from "lucide-react";
import { formatBRL } from "@/lib/price-calculator";

interface PriceHistoryEntry {
  id: string;
  oldPrice: number;
  newPrice: number;
  margin: number;
  finalPrice: number;
  userResponsible: string;
  reason: string | null;
  createdAt: string;
}

interface PriceHistoryModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PriceHistoryModal({
  productId,
  productName,
  isOpen,
  onClose,
}: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !productId) return;

    async function loadHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/history?productId=${productId}`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-[#e5e5ea]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e5ea] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
              <History className="w-5 h-5 text-[#0071e3]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1d1d1f]">Histórico de Preços</h3>
              <p className="text-xs text-[#86868b] line-clamp-1">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#86868b] animate-pulse">
              Carregando histórico detalhado...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868b]">
              Nenhum registro de alteração de preço para este produto ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h, idx) => {
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
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-[#1d1d1f] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#0071e3]" />
                          {h.userResponsible}
                        </span>
                        <span className="text-[#86868b]">•</span>
                        <span className="text-[#86868b] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate} às {formattedTime}
                        </span>
                      </div>

                      {h.reason && (
                        <div className="text-[11px] text-[#86868b] mb-1 italic">
                          "{h.reason}"
                        </div>
                      )}

                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[#86868b]">Original:</span>
                        {priceChanged ? (
                          <>
                            <span className="line-through text-[#86868b]">
                              {formatBRL(h.oldPrice)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#0071e3]" />
                            <span className="font-bold text-[#1d1d1f]">
                              {formatBRL(h.newPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-[#1d1d1f]">
                            {formatBRL(h.newPrice)}
                          </span>
                        )}
                        <span className="ml-2 text-[#86868b]">Margem:</span>
                        <span className="font-semibold text-[#34c759]">
                          +{formatBRL(h.margin)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-[#e5e5ea] sm:pl-4 pt-2 sm:pt-0">
                      <div className="text-[10px] text-[#86868b] uppercase font-semibold">
                        Preço Final
                      </div>
                      <div className="text-base font-bold text-[#1d1d1f] font-mono">
                        {formatBRL(h.finalPrice)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fbfbfd] border-t border-[#e5e5ea] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-[#1d1d1f] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
