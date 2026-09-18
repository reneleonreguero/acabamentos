"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { CART_KEY, CartItem, getBrowserStorageSnapshot, parseStorageArray, subscribeToStorage, writeStorage } from "@/lib/storage";

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  addItem: (productId: number, quantity?: number) => void;
  updateItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const serializedItems = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(CART_KEY),
    () => "[]",
  );
  const items = useMemo(() => parseStorageArray<CartItem>(serializedItems), [serializedItems]);

  function commit(nextItems: CartItem[]) {
    writeStorage(CART_KEY, nextItems);
  }

  function addItem(productId: number, quantity = 1) {
    const existing = items.find((item) => item.productId === productId);
    if (existing) {
      commit(items.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item));
      return;
    }
    commit([...items, { productId, quantity }]);
  }

  function updateItem(productId: number, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    commit(items.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeItem(productId: number) {
    commit(items.filter((item) => item.productId !== productId));
  }

  function clearCart() { commit([]); }

  return (
    <CartContext.Provider value={{ items, count: items.length, hydrated: true, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
