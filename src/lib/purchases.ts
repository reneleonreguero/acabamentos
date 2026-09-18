export const PURCHASES_KEY = "casa-sao-jose-purchases";

export type PurchaseStatus = "Rascunho" | "Enviado" | "Recebido" | "Cancelado";

export type PurchaseItem = { productId: number; quantity: number; cost: number };

export type Purchase = {
  id: string;
  supplierId?: string;
  supplier: string;
  items: PurchaseItem[];
  freight: number;
  status: PurchaseStatus;
  createdAt: string;
  expectedAt: string;
  notes: string;
};

export type Supplier = {
  id: number;
  name: string;
  contact: string;
  city: string;
  categories: string[];
};

export const suppliers: Supplier[] = [
  { id: 1, name: "Embramaco Revestimentos", contact: "(11) 4002-8890", city: "Mogi das Cruzes/SP", categories: ["Pisos", "Porcelanatos"] },
  { id: 2, name: "Porcelanato Premium Distribuidora", contact: "(11) 4224-1170", city: "Itapecerica da Serra/SP", categories: ["Pisos", "Revestimentos"] },
  { id: 3, name: "Casa São José Indústria", contact: "(11) 4667-2020", city: "Embu das Artes/SP", categories: ["Portas", "Madeiras"] },
  { id: 4, name: "Votorantim Quartzolit", contact: "(11) 3003-7744", city: "São Paulo/SP", categories: ["Impermeabilização", "Argamassas"] },
  { id: 5, name: "Fênix Ferragens e Acabamentos", contact: "(11) 4555-9090", city: "Cotia/SP", categories: ["Ferragens", "Portas"] },
];

export function purchaseTotal(purchase: Pick<Purchase, "items" | "freight">) {
  return purchase.items.reduce((sum, item) => sum + item.quantity * item.cost, 0) + purchase.freight;
}

export const demoPurchases: Purchase[] = [
  { id: "CMP-5003", supplierId: "FOR-1001", supplier: "Embramaco Revestimentos", items: [{ productId: 2, quantity: 80, cost: 26.5 }, { productId: 1, quantity: 40, cost: 33.4 }], freight: 0, status: "Enviado", createdAt: "2026-09-15T09:40:00", expectedAt: "2026-09-22", notes: "Reposição de linha de maior giro." },
  { id: "CMP-5002", supplierId: "FOR-1004", supplier: "Votorantim Quartzolit", items: [{ productId: 8, quantity: 40, cost: 132 }], freight: 60, status: "Recebido", createdAt: "2026-09-11T14:05:00", expectedAt: "2026-09-16", notes: "" },
  { id: "CMP-5001", supplierId: "FOR-1003", supplier: "Casa São José Indústria", items: [{ productId: 7, quantity: 30, cost: 118 }], freight: 0, status: "Rascunho", createdAt: "2026-09-17T08:15:00", expectedAt: "2026-09-30", notes: "Confirmar medida do batente antes de enviar." },
];
