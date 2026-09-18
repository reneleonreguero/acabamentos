export const CART_KEY = "acabamentos-erp-cart";
export const SHOP_CART_KEY = "casa-sao-jose-shop-cart";
export const QUOTES_KEY = "acabamentos-erp-quotes";
export const ORDERS_KEY = "casa-sao-jose-orders";
export const SALES_KEY = "casa-sao-jose-sales";
export const STORAGE_EVENT = "acabamentos-storage-change";

export type CartItem = { productId: number; quantity: number };

export type Quote = {
  id: string;
  customerId?: string;
  convertedSaleId?: string;
  customer: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  status: "Novo" | "Em atendimento" | "Enviado" | "Aprovado";
};

export type Order = {
  id: string;
  customerId?: string;
  customer: { name: string; phone: string; email: string; document: string };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: "Retirada" | "Entrega";
  address?: { zip: string; street: string; number: string; complement: string; district: string; city: string; region: string };
  payment: { method: "Cartão" | "Pix"; installments?: number; brand?: string; last4?: string };
  paymentStatus: "Pago (simulação)";
  orderStatus: "Aguardando separação" | "Agendado" | "Em rota" | "Entregue" | "Ocorrência" | "Cancelado";
  createdAt: string;
};

export type SalePayment = {
  method: "Pix" | "Cartão" | "Dinheiro" | "Crediário";
  installments?: number;
  received?: number;
  change?: number;
};

export type Sale = {
  id: string;
  customerId?: string;
  customer: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: SalePayment;
  status: "Concluída" | "Separação" | "Entrega" | "Cancelada";
  createdAt: string;
  cashier: string;
  fulfillment?: "Retirada" | "Entrega";
  phone?: string;
  deliveryAddress?: string;
};

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

export function removeStorage(keys: string[]) {
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

export function subscribeToStorage(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getStorageSnapshot(key: string, fallback = "[]") {
  return window.localStorage.getItem(key) ?? fallback;
}

let storageHydrated = false;

export function getBrowserStorageSnapshot(key: string, fallback = "[]") {
  return storageHydrated ? getStorageSnapshot(key, fallback) : fallback;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function parseStorageArray<T>(serialized: string, fallback: T[] = []) {
  try {
    const value = JSON.parse(serialized);
    return Array.isArray(value) ? value as T[] : fallback;
  } catch {
    return fallback;
  }
}

export function hydrateStorage() {
  if (storageHydrated) return;
  storageHydrated = true;
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}
