"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { CartItem, getBrowserStorageSnapshot, parseStorageArray, SHOP_CART_KEY, subscribeToStorage, writeStorage } from "@/lib/storage";

type ShopCartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (productId: number, quantity?: number) => void;
  updateItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const serializedItems = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(SHOP_CART_KEY),
    () => "[]",
  );
  const items = useMemo(() => parseStorageArray<CartItem>(serializedItems), [serializedItems]);

  function commit(nextItems: CartItem[]) { writeStorage(SHOP_CART_KEY, nextItems); }

  function addItem(productId: number, quantity = 1) {
    const existing = items.find((item) => item.productId === productId);
    commit(existing
      ? items.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item)
      : [...items, { productId, quantity }]);
  }

  function updateItem(productId: number, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    commit(items.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeItem(productId: number) { commit(items.filter((item) => item.productId !== productId)); }
  function clearCart() { commit([]); }

  return <ShopCartContext.Provider value={{ items, count: items.length, addItem, updateItem, removeItem, clearCart }}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const context = useContext(ShopCartContext);
  if (!context) throw new Error("useShopCart deve ser usado dentro de ShopCartProvider");
  return context;
}
