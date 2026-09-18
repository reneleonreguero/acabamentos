export const FINANCIAL_KEY = "casa-sao-jose-financial";

export type FinancialKind = "Receber" | "Pagar";
export type FinancialStatus = "Pendente" | "Pago" | "Vencido" | "Cancelado";

export type FinancialEntry = {
  id: string;
  kind: FinancialKind;
  description: string;
  party: string;
  category: string;
  amount: number;
  dueAt: string;
  paidAt?: string;
  status: FinancialStatus;
  sourceType: "Venda" | "Pedido" | "Compra" | "Manual";
  sourceId?: string;
  createdAt: string;
};

export const demoFinancialEntries: FinancialEntry[] = [
  { id: "FIN-7001", kind: "Receber", description: "Venda VD-2841", party: "Carla Mendes", category: "Vendas", amount: 2473.8, dueAt: "2026-09-17", paidAt: "2026-09-17", status: "Pago", sourceType: "Venda", sourceId: "VD-2841", createdAt: "2026-09-17T11:10:00" },
  { id: "FIN-7002", kind: "Receber", description: "Crediário VD-2838", party: "Paula Ribeiro", category: "Crediário", amount: 2245.5, dueAt: "2026-09-25", status: "Pendente", sourceType: "Venda", sourceId: "VD-2838", createdAt: "2026-09-16T15:20:00" },
  { id: "FIN-7003", kind: "Pagar", description: "Compra CMP-5003", party: "Embramaco Revestimentos", category: "Fornecedores", amount: 3456, dueAt: "2026-09-22", status: "Pendente", sourceType: "Compra", sourceId: "CMP-5003", createdAt: "2026-09-15T09:40:00" },
  { id: "FIN-7004", kind: "Pagar", description: "Conta de energia", party: "Concessionária", category: "Despesas fixas", amount: 890.4, dueAt: "2026-09-12", status: "Vencido", sourceType: "Manual", createdAt: "2026-09-01T08:00:00" },
  { id: "FIN-7005", kind: "Pagar", description: "Compra CMP-5002", party: "Votorantim Quartzolit", category: "Fornecedores", amount: 5340, dueAt: "2026-09-16", paidAt: "2026-09-16", status: "Pago", sourceType: "Compra", sourceId: "CMP-5002", createdAt: "2026-09-11T14:05:00" },
];
