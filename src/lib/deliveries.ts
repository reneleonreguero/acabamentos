export const DELIVERIES_KEY = "casa-sao-jose-deliveries";

export type DeliveryStatus = "A separar" | "Agendada" | "Em rota" | "Entregue" | "Ocorrência" | "Cancelada";

export type Delivery = {
  id: string;
  sourceType: "Pedido" | "Venda" | "Manual";
  sourceId?: string;
  customer: string;
  phone: string;
  address: string;
  scheduledAt: string;
  window: "Manhã" | "Tarde" | "Comercial";
  assignee: string;
  status: DeliveryStatus;
  notes: string;
  items: { productId: number; quantity: number }[];
  total: number;
  createdAt: string;
};

export const demoDeliveries: Delivery[] = [
  { id: "ENT-6003", sourceType: "Venda", sourceId: "VD-2838", customer: "Paula Ribeiro", phone: "(11) 95518-3010", address: "Alameda Ipê, 76 - Itapecerica da Serra/SP", scheduledAt: "2026-09-18", window: "Tarde", assignee: "Carlos", status: "Agendada", notes: "Avisar 30 minutos antes.", items: [{ productId: 4, quantity: 45 }], total: 2245.5, createdAt: "2026-09-16T15:30:00" },
  { id: "ENT-6002", sourceType: "Venda", sourceId: "VD-2840", customer: "Construtora Horizonte", phone: "(11) 97710-1234", address: "Av. Industrial, 850 - Cotia/SP", scheduledAt: "2026-09-18", window: "Manhã", assignee: "Marcos", status: "A separar", notes: "Descarga no portão lateral.", items: [{ productId: 1, quantity: 137 }], total: 6836.3, createdAt: "2026-09-17T10:15:00" },
  { id: "ENT-6001", sourceType: "Manual", customer: "Marina Costa", phone: "(11) 98800-1122", address: "Rua das Acácias, 90 - Centro", scheduledAt: "2026-09-17", window: "Manhã", assignee: "Carlos", status: "Em rota", notes: "", items: [{ productId: 2, quantity: 20 }], total: 798, createdAt: "2026-09-15T09:00:00" },
];
