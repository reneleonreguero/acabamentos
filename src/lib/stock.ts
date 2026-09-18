import { Product } from "@/data/products";

export const STOCK_KEY = "casa-sao-jose-stock";
export const STOCK_MOVEMENTS_KEY = "casa-sao-jose-stock-movements";
export const DEFAULT_MIN = 12;

export type StockEntry = { productId: number; quantity: number; min: number };

export type StockMovement = {
  id: string;
  productId: number;
  type: "Entrada" | "Saída" | "Ajuste";
  quantity: number;
  reason: string;
  createdAt: string;
  user: string;
};

export type StockStatus = "Sem estoque" | "Crítico" | "Baixo" | "Normal";

export function effectiveStock(entries: StockEntry[], product: Product) {
  const entry = entries.find((item) => item.productId === product.id);
  return { quantity: entry?.quantity ?? product.stock, min: entry?.min ?? DEFAULT_MIN };
}

export function stockStatus(quantity: number, min: number): StockStatus {
  if (quantity <= 0) return "Sem estoque";
  if (quantity <= min * 0.5) return "Crítico";
  if (quantity < min) return "Baixo";
  return "Normal";
}