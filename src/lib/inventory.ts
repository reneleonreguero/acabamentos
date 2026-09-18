export const INVENTORIES_KEY = "casa-sao-jose-inventories";

export type InventoryStatus = "Em andamento" | "Concluído";

export type InventoryItem = {
  productId: number;
  expected: number;
  counted?: number;
};

export type Inventory = {
  id: string;
  status: InventoryStatus;
  createdAt: string;
  completedAt?: string;
  notes: string;
  user: string;
  items: InventoryItem[];
};

export const demoInventories: Inventory[] = [
  {
    id: "INV-2041",
    status: "Concluído",
    createdAt: "2026-09-10T08:20:00",
    completedAt: "2026-09-10T16:45:00",
    notes: "Contagem semanal do depósito principal.",
    user: "Ana",
    items: [
      { productId: 1, expected: 40, counted: 38 },
      { productId: 2, expected: 61, counted: 62 },
      { productId: 7, expected: 18, counted: 18 },
      { productId: 8, expected: 24, counted: 23 },
    ],
  },
];
