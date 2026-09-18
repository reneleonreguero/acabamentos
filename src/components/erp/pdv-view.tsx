"use client";

import {
  Banknote, CheckCircle2, CreditCard, Landmark, Minus, PackagePlus, Plus, QrCode, Receipt, RotateCcw, Search, ShoppingBag, Trash2, WalletCards,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/data/products";
import { Delivery, DELIVERIES_KEY, demoDeliveries } from "@/lib/deliveries";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry } from "@/lib/finance";
import { Customer, CUSTOMERS_KEY, demoCustomers, demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct } from "@/lib/registrations";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement } from "@/lib/stock";
import { CartItem, createId, readStorage, Sale, SALES_KEY, writeStorage } from "@/lib/storage";
import { useStorageCollection } from "@/lib/use-storage-collection";

export type PdvTab = "nova" | "vendas";

export const demoSales: Sale[] = [
  { id: "VD-2841", customer: "Carla Mendes", items: [{ productId: 2, quantity: 62 }], subtotal: 2473.8, discount: 0, total: 2473.8, payment: { method: "Pix" }, status: "Concluída", createdAt: "2026-09-17T11:10:00", cashier: "Ana" },
  { id: "VD-2840", customer: "Construtora Horizonte", items: [{ productId: 1, quantity: 137 }], subtotal: 6836.3, discount: 0, total: 6836.3, payment: { method: "Cartão", installments: 3 }, status: "Separação", createdAt: "2026-09-17T10:05:00", cashier: "Ana" },
  { id: "VD-2839", customer: "Henrique Souza", items: [{ productId: 7, quantity: 3 }, { productId: 8, quantity: 2 }], subtotal: 935, discount: 0, total: 935, payment: { method: "Dinheiro", received: 1000, change: 65 }, status: "Concluída", createdAt: "2026-09-16T16:40:00", cashier: "Ana" },
  { id: "VD-2838", customer: "Paula Ribeiro", items: [{ productId: 4, quantity: 45 }], subtotal: 2245.5, discount: 0, total: 2245.5, payment: { method: "Crediário" }, status: "Entrega", createdAt: "2026-09-16T15:20:00", cashier: "Ana" },
];

function parseMoney(value: string) {
  const clean = value.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function productName(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId)?.name ?? `Produto ${productId}`;
}

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function NovaVenda({ products, customers, stockEntries, stockMovements, financialEntries, deliveries, onGoHistory }: {
  products: RegisteredProduct[];
  customers: Customer[];
  stockEntries: StockEntry[];
  stockMovements: StockMovement[];
  financialEntries: FinancialEntry[];
  deliveries: Delivery[];
  onGoHistory: () => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<"Pix" | "Cartão" | "Dinheiro" | "Crediário">("Pix");
  const [installments, setInstallments] = useState(1);
  const [received, setReceived] = useState("");
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">("Retirada");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<Sale | null>(null);

  const activeProducts = products.filter((product) => product.active);
  const activeCustomers = customers.filter((customer) => customer.active);
  const selectedCustomer = activeCustomers.find((customer) => customer.id === customerId);
  const lineItems = items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product);
  const filteredProducts = activeProducts.filter((product) => {
    const term = search.trim().toLowerCase();
    return !term || product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
  });
  const subtotal = lineItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const discountValue = subtotal * (discount / 100);
  const total = subtotal - discountValue;
  const receivedValue = method === "Dinheiro" ? parseMoney(received) : 0;
  const change = receivedValue - total;

  function addItem(productId: number) {
    setItems((current) => current.some((item) => item.productId === productId)
      ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { productId, quantity: 1 }]);
  }

  function updateItem(productId: number, quantity: number) {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    setItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function reset() {
    setItems([]);
    setCustomerId("");
    setDiscount(0);
    setMethod("Pix");
    setInstallments(1);
    setReceived("");
    setFulfillment("Retirada");
    setPhone("");
    setDeliveryAddress("");
    setMessage(null);
  }

  function finalize() {
    if (items.length === 0) return;
    if (method === "Dinheiro" && receivedValue < total) return;
    if (fulfillment === "Entrega" && (!phone.trim() || !deliveryAddress.trim())) {
      setMessage("Informe telefone e endereço para a entrega.");
      return;
    }

    const currentStock = readStorage<StockEntry[]>(STOCK_KEY, stockEntries);
    const unavailable = items.find((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return !product || effectiveStock(currentStock, product).quantity < item.quantity;
    });
    if (unavailable) {
      setMessage(`Saldo insuficiente para ${productName(products, unavailable.productId)}.`);
      return;
    }

    const sales = readStorage<Sale[]>(SALES_KEY, []);
    const createdAt = new Date().toISOString();
    const id = createId("VD");
    const customer = selectedCustomer?.name ?? "Consumidor";
    const sale: Sale = {
      id,
      customerId: selectedCustomer?.id,
      customer,
      items,
      subtotal,
      discount: discountValue,
      total,
      payment: method === "Dinheiro" ? { method, received: receivedValue, change: Math.max(0, change) }
        : method === "Cartão" ? { method, installments }
        : { method },
      status: fulfillment === "Entrega" ? "Entrega" : "Concluída",
      createdAt,
      cashier: "Ana",
      fulfillment,
      phone: fulfillment === "Entrega" ? phone.trim() : undefined,
      deliveryAddress: fulfillment === "Entrega" ? deliveryAddress.trim() : undefined,
    };

    const nextStock = [...currentStock];
    items.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      const current = effectiveStock(nextStock, product);
      const entry = { productId: item.productId, quantity: current.quantity - item.quantity, min: current.min };
      const index = nextStock.findIndex((saved) => saved.productId === item.productId);
      if (index >= 0) nextStock[index] = entry; else nextStock.push(entry);
    });
    const currentMovements = readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, stockMovements);
    const movements: StockMovement[] = items.map((item) => ({
      id: createId("MOV"), productId: item.productId, type: "Saída", quantity: item.quantity,
      reason: `Venda ${id}`, createdAt, user: "Ana",
    }));
    const currentFinancial = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    const paid = method !== "Crediário";
    const financial: FinancialEntry = {
      id: createId("FIN"), kind: "Receber", description: `${method === "Crediário" ? "Crediário" : "Venda"} ${id}`,
      party: customer, category: method === "Crediário" ? "Crediário" : "Vendas", amount: total,
      dueAt: localDate(), paidAt: paid ? localDate() : undefined, status: paid ? "Pago" : "Pendente",
      sourceType: "Venda", sourceId: id, createdAt,
    };

    writeStorage(STOCK_KEY, nextStock);
    writeStorage(STOCK_MOVEMENTS_KEY, [...movements, ...currentMovements]);
    writeStorage(FINANCIAL_KEY, [financial, ...currentFinancial]);
    if (fulfillment === "Entrega") {
      const currentDeliveries = readStorage<Delivery[]>(DELIVERIES_KEY, deliveries);
      const delivery: Delivery = {
        id: createId("ENT"), sourceType: "Venda", sourceId: id, customer, phone: phone.trim(),
        address: deliveryAddress.trim(), scheduledAt: localDate(), window: "Comercial", assignee: "A definir",
        status: "A separar", notes: "", items, total, createdAt,
      };
      writeStorage(DELIVERIES_KEY, [delivery, ...currentDeliveries]);
    }
    writeStorage(SALES_KEY, [sale, ...sales]);
    setSuccess(sale);
    reset();
  }

  if (success) return (
    <div className="rounded-lg border border-black/7 bg-white p-8 text-center">
      <CheckCircle2 size={46} className="mx-auto text-[#19a05a]" />
      <h3 className="font-display mt-5 text-3xl">Venda {success.id} registrada.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#77756e]">Lançada no caixa simulado com status “Concluída”. Ela já aparece no histórico de vendas e no dashboard.</p>
      <div className="mx-auto mt-7 max-w-md border border-black/8 p-5 text-left text-xs">
        <div className="flex justify-between border-b border-black/6 pb-3"><span className="text-[#88867e]">Cliente</span><strong>{success.customer}</strong></div>
        <div className="mt-3 space-y-2">{success.items.map((item) => <div key={item.productId} className="flex justify-between gap-3"><span className="text-[#77756e]">{item.quantity}× {productName(products, item.productId)}</span><span>{formatCurrency((products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity)}</span></div>)}</div>
        {success.discount > 0 && <div className="mt-3 flex justify-between"><span className="text-[#77756e]">Desconto</span><span className="text-[#b83c1d]">− {formatCurrency(success.discount)}</span></div>}
        <div className="mt-3 flex justify-between border-t border-black/6 pt-3 text-sm"><strong>Total</strong><strong className="font-display text-2xl font-normal">{formatCurrency(success.total)}</strong></div>
        <div className="mt-3 flex justify-between"><span className="text-[#77756e]">Pagamento</span><strong>{success.payment.method}{success.payment.installments ? ` em ${success.payment.installments}x` : ""}</strong></div>
        {success.payment.method === "Dinheiro" && <div className="mt-2 flex justify-between"><span className="text-[#77756e]">Troco</span><strong>{formatCurrency(success.payment.change ?? 0)}</strong></div>}
      </div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={() => setSuccess(null)} className="h-12 rounded-md bg-[#073f8c] px-6 text-xs font-bold text-white">NOVA VENDA</button>
        <button onClick={() => { setSuccess(null); onGoHistory(); }} className="h-12 rounded-md border border-black/10 bg-white px-6 text-xs font-bold">VER HISTÓRICO</button>
      </div>
    </div>
  );

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 sm:flex-row sm:items-center">
          <div><h3 className="font-display text-xl">Produtos</h3><p className="mt-1 text-[10px] text-[#88867e]">Clique em + para adicionar ao caixa</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 bg-white px-3 sm:w-64"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar produto..." /></label>
        </div>
        <div className="max-h-[560px] divide-y divide-black/7 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="h-10 w-10 shrink-0 rounded-md bg-[#eef1f5] text-[9px] font-bold text-[#9a98a0] grid place-items-center">{product.category.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[10px] text-[#88867e]">{product.brand} · {product.size}</p></div>
              {product.price !== undefined ? <div className="text-right"><p className="text-xs font-bold">{formatCurrency(product.price)}</p><p className="text-[9px] text-[#88867e]">/ {product.unit}</p></div> : <span className="text-[9px] font-bold text-[#a8943a]">SOB CONSULTA</span>}
              <button onClick={() => product.price !== undefined && addItem(product.id)} disabled={product.price === undefined} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#073f8c] text-white enabled:hover:bg-[#ed1c24] disabled:opacity-30" aria-label={`Adicionar ${product.name}`}><Plus size={17} /></button>
            </div>
          ))}
          {filteredProducts.length === 0 && <div className="grid place-items-center p-10 text-center"><Search size={24} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum produto encontrado.</p></div>}
        </div>
      </div>

      <div className="rounded-lg border border-black/7 bg-white p-5">
        <div className="flex items-center justify-between"><h3 className="font-display text-xl">Venda atual</h3><button onClick={reset} title="Limpar venda" className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-[#77756e]"><RotateCcw size={15} /></button></div>
        <label className="mt-5 block text-xs font-bold text-[#77756e] uppercase">Cliente<select value={customerId} onChange={(event) => {
          const nextId = event.target.value;
          const nextCustomer = activeCustomers.find((customer) => customer.id === nextId);
          setCustomerId(nextId);
          setPhone(nextCustomer?.phone ?? "");
          setDeliveryAddress(nextCustomer ? [nextCustomer.address, nextCustomer.city].filter(Boolean).join(" - ") : "");
        }} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-[#073f8c]"><option value="">Consumidor</option>{activeCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>

        <div className="mt-5 divide-y divide-black/7">
          {lineItems.length === 0 ? <div className="grid place-items-center py-8 text-center"><ShoppingBag size={26} className="text-[#c8c5bd]" /><p className="mt-2 text-xs text-[#88867e]">Adicione produtos do catálogo.</p></div> : lineItems.map(({ product, productId, quantity }) => product && (
            <div key={productId} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{formatCurrency(product.price!)} / {product.unit}</p></div>
              <div className="flex h-9 items-center border border-black/10 rounded-md"><button onClick={() => updateItem(productId, quantity - 1)} className="grid h-full w-8 place-items-center text-[#77756e]"><Minus size={13} /></button><span className="min-w-8 text-center text-xs font-bold">{quantity}</span><button onClick={() => updateItem(productId, quantity + 1)} className="grid h-full w-8 place-items-center text-[#77756e]"><Plus size={13} /></button></div>
              <span className="w-16 text-right text-xs font-bold">{formatCurrency(product.price! * quantity)}</span>
              <button onClick={() => updateItem(productId, 0)} title="Remover" className="grid h-8 w-8 place-items-center rounded-md text-[#b0ada5] hover:text-[#b83c1d]"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="mt-2 border-t border-black/7 pt-4 text-xs">
          <div className="flex items-center justify-between"><span className="text-[#77756e]">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="mt-2 flex items-center justify-between gap-4"><label className="flex w-40 items-center gap-2 text-[#77756e]">Desconto (%): <input type="number" min={0} max={100} value={discount} onChange={(event) => setDiscount(Math.max(0, Math.min(100, Number(event.target.value))))} className="h-9 w-16 rounded-md border border-black/10 px-2 text-right font-semibold text-[#282824] outline-none" /></label><span className="text-[#b83c1d]">− {formatCurrency(discountValue)}</span></div>
          <div className="mt-2 flex items-end justify-between border-t border-black/6 pt-4"><strong>Total</strong><strong className="font-display text-3xl font-normal">{formatCurrency(total)}</strong></div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {([["Pix", QrCode], ["Cartão", CreditCard], ["Dinheiro", Banknote], ["Crediário", Landmark]] as const).map(([label, Icon]) => (
            <button key={label} onClick={() => setMethod(label)} className={`flex h-11 items-center justify-center gap-2 rounded-md text-xs font-bold ${method === label ? "bg-[#073f8c] text-white" : "border border-black/10 text-[#55534c]"}`}><Icon size={16} /> {label}</button>
          ))}
        </div>
        {method === "Cartão" && <div className="mt-3 flex items-center gap-3"><label className="text-[10px] text-[#77756e]">PARCELAS:</label><button onClick={() => setInstallments(1)} className={`min-w-12 rounded-md border px-2 py-2 text-xs font-bold ${installments === 1 ? "border-[#073f8c] bg-[#eaf1fb] text-[#073f8c]" : "border-black/10 text-[#55534c]"}`}>1×</button>{[2, 3, 4, 5, 6].map((amount) => <button key={amount} onClick={() => setInstallments(amount)} className={`min-w-12 rounded-md border px-2 py-2 text-[11px] font-bold ${installments === amount ? "border-[#073f8c] bg-[#eaf1fb] text-[#073f8c]" : "border-black/10 text-[#55534c]"}`}>{amount}×</button>)}</div>}
        {method === "Cartão" && <p className="mt-3 rounded-md bg-[#f2f4f7] px-3 py-2 text-[10px] text-[#77756e]">{installments}x de {formatCurrency(total / installments)} sem juros</p>}
        {method === "Dinheiro" && <div className="mt-3 flex items-center gap-3"><label className="flex-1 text-xs font-bold text-[#77756e] uppercase">Recebido:<input value={received} onChange={(event) => setReceived(event.target.value)} placeholder="0,00" className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-semibold outline-none focus:border-[#073f8c]" /></label>{receivedValue > 0 && <p className="shrink-0 text-xs font-bold text-[#5b7559]">Troco: {formatCurrency(Math.max(0, change))}</p>}</div>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["Retirada", "Entrega"] as const).map((option) => <button key={option} onClick={() => { setFulfillment(option); setMessage(null); }} className={`h-11 rounded-md text-xs font-bold ${fulfillment === option ? "bg-[#073f8c] text-white" : "border border-black/10 text-[#55534c]"}`}>{option}</button>)}
        </div>
        {fulfillment === "Entrega" && <div className="mt-3 grid gap-3"><label className="text-xs font-bold text-[#77756e] uppercase">Telefone *<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="(11) 00000-0000" /></label><label className="text-xs font-bold text-[#77756e] uppercase">Endereço *<input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Rua, número, bairro e cidade" /></label></div>}
        {message && <p className="mt-3 rounded-md bg-[#fff0e8] px-3 py-2 text-[10px] font-semibold text-[#b83c1d]">{message}</p>}

        <button onClick={finalize} disabled={items.length === 0 || (method === "Dinheiro" && receivedValue < total) || (fulfillment === "Entrega" && (!phone.trim() || !deliveryAddress.trim()))} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-sm font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><Receipt size={18} /> FINALIZAR VENDA</button>
        <p className="mt-3 text-center text-[10px] text-[#99968e]">Venda lançada no protótipo, sem cobrança real.</p>
      </div>
    </div>
  );
}

function Historico({ storedSales, products, stockEntries, stockMovements, financialEntries, deliveries, onNavigate }: {
  storedSales: Sale[];
  products: RegisteredProduct[];
  stockEntries: StockEntry[];
  stockMovements: StockMovement[];
  financialEntries: FinancialEntry[];
  deliveries: Delivery[];
  onNavigate: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Todos" | Sale["status"]>("Todos");
  const [message, setMessage] = useState<string | null>(null);
  const sales = [...storedSales, ...demoSales];
  const filtered = sales.filter((sale) => {
    const term = search.trim().toLowerCase();
    return (!term || sale.customer.toLowerCase().includes(term) || sale.id.toLowerCase().includes(term)) && (status === "Todos" || sale.status === status);
  });
  const totalValid = filtered.filter((sale) => sale.status !== "Cancelada").reduce((sum, sale) => sum + sale.total, 0);

  function updateStatus(id: string, next: Sale["status"]) {
    const currentSales = readStorage<Sale[]>(SALES_KEY, storedSales);
    const sale = currentSales.find((item) => item.id === id);
    if (!sale || sale.status === next) return;

    const currentStock = readStorage<StockEntry[]>(STOCK_KEY, stockEntries);
    const currentMovements = readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, stockMovements);
    const saleReason = `Venda ${id}`;
    const cancellationReason = `Cancelamento da venda ${id}`;
    const stockNeedsChange = sale.items.filter((item) => {
      const exits = currentMovements.filter((movement) => movement.productId === item.productId && movement.type === "Saída" && movement.reason.startsWith(saleReason)).length;
      const returns = currentMovements.filter((movement) => movement.productId === item.productId && movement.type === "Entrada" && movement.reason === cancellationReason).length;
      return next === "Cancelada" ? exits > returns : sale.status === "Cancelada" && returns >= exits && exits > 0;
    });

    if (sale.status === "Cancelada" && next !== "Cancelada") {
      const unavailable = stockNeedsChange.find((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return !product || effectiveStock(currentStock, product).quantity < item.quantity;
      });
      if (unavailable) {
        setMessage(`Não foi possível reativar: saldo insuficiente para ${productName(products, unavailable.productId)}.`);
        return;
      }
    }

    const createdAt = new Date().toISOString();
    const nextStock = [...currentStock];
    const movements: StockMovement[] = [];
    stockNeedsChange.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return;
      const current = effectiveStock(nextStock, product);
      const restoring = next === "Cancelada";
      const entry = { productId: item.productId, quantity: current.quantity + (restoring ? item.quantity : -item.quantity), min: current.min };
      const index = nextStock.findIndex((saved) => saved.productId === item.productId);
      if (index >= 0) nextStock[index] = entry; else nextStock.push(entry);
      movements.push({
        id: createId("MOV"), productId: item.productId, type: restoring ? "Entrada" : "Saída", quantity: item.quantity,
        reason: restoring ? cancellationReason : saleReason, createdAt, user: "Ana",
      });
    });

    const currentFinancial = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    const nextFinancial = currentFinancial.map((entry): FinancialEntry => {
      if (entry.sourceType !== "Venda" || entry.sourceId !== id) return entry;
      if (next === "Cancelada") return { ...entry, status: "Cancelado" };
      const paid = sale.payment.method !== "Crediário";
      return { ...entry, status: paid ? "Pago" : "Pendente", paidAt: paid ? entry.paidAt ?? localDate() : undefined };
    });
    const currentDeliveries = readStorage<Delivery[]>(DELIVERIES_KEY, deliveries);
    let nextDeliveries = currentDeliveries.map((delivery): Delivery => delivery.sourceType === "Venda" && delivery.sourceId === id && next === "Cancelada" ? { ...delivery, status: "Cancelada" } : delivery);
    if (sale.status === "Cancelada" && next !== "Cancelada" && sale.fulfillment === "Entrega" && sale.phone && sale.deliveryAddress) {
      const existingDelivery = nextDeliveries.find((delivery) => delivery.sourceType === "Venda" && delivery.sourceId === id);
      if (existingDelivery) {
        nextDeliveries = nextDeliveries.map((delivery): Delivery => delivery.id === existingDelivery.id ? { ...delivery, status: "A separar" } : delivery);
      } else {
      nextDeliveries = [{
        id: createId("ENT"), sourceType: "Venda", sourceId: id, customer: sale.customer, phone: sale.phone,
        address: sale.deliveryAddress, scheduledAt: localDate(), window: "Comercial", assignee: "A definir",
        status: "A separar", notes: "", items: sale.items, total: sale.total, createdAt,
      }, ...nextDeliveries];
      }
    }

    if (stockNeedsChange.length > 0) {
      writeStorage(STOCK_KEY, nextStock);
      writeStorage(STOCK_MOVEMENTS_KEY, [...movements, ...currentMovements]);
    }
    writeStorage(FINANCIAL_KEY, nextFinancial);
    writeStorage(DELIVERIES_KEY, nextDeliveries);
    writeStorage(SALES_KEY, currentSales.map((item) => item.id === id ? { ...item, status: next } : item));
    setMessage(next === "Cancelada" ? `Venda ${id} cancelada e integrações revertidas.` : `Venda ${id} reativada.`);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 md:flex-row md:items-center">
        <div><h3 className="font-display text-xl">Vendas registradas</h3><p className="mt-1 text-[10px] text-[#88867e]">{filtered.length} venda(s) · {formatCurrency(totalValid)} em vendas válidas</p></div>
        <div className="flex gap-2">
          <label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 px-3 md:w-52"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar por venda ou cliente..." /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as "Todos" | Sale["status"])} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none"><option>Todos</option>{(["Concluída", "Separação", "Entrega", "Cancelada"] as const).map((option) => <option key={option}>{option}</option>)}</select>
        </div>
      </div>
      {message && <p className="border-b border-black/7 bg-[#f2f4f7] px-5 py-3 text-[10px] font-semibold text-[#55534c]">{message}</p>}
      {filtered.length === 0 ? <div className="grid place-items-center p-12 text-center"><WalletCards size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhuma venda encontrada.</p></div> : <div className="divide-y divide-black/6">{filtered.map((sale) => (
        <div key={sale.id} className="grid gap-2 p-4 sm:grid-cols-[.6fr_1.1fr_1fr_.7fr_.8fr_auto] sm:items-center sm:gap-4">
          <div><p className="text-xs font-bold text-[#ed1c24]">{sale.id}</p><p className="mt-1 text-[9px] text-[#99968e]">{new Date(sale.createdAt).toLocaleDateString("pt-BR")} · {sale.cashier}</p></div>
          <div className="min-w-0"><p className="truncate text-xs font-semibold">{sale.customer}</p><p className="mt-1 truncate text-[9px] text-[#88867e]">{sale.items.map((item) => `${item.quantity}× ${productName(products, item.productId)}`).join(", ")}</p></div>
          <p className="text-[10px] font-semibold text-[#77756e]">{sale.payment.method}{sale.payment.installments ? ` ${sale.payment.installments}x` : ""}</p>
          <p className="text-right text-xs font-bold sm:text-left">{formatCurrency(sale.total)}</p>
          {storedSales.some((item) => item.id === sale.id) ? <select value={sale.status} onChange={(event) => updateStatus(sale.id, event.target.value as Sale["status"])} className="rounded-full border-0 bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold outline-none"><option>Concluída</option><option>Separação</option><option>Entrega</option><option>Cancelada</option></select> : <span className="text-[10px] font-bold text-[#9a98a0]">Registro demo</span>}
        </div>
      ))}</div>}
      <div className="border-t border-black/7 bg-[#f7f8fa] px-5 py-4"><button onClick={onNavigate} className="flex h-11 items-center gap-2 rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white"><PackagePlus size={16} /> ABRIR NOVO CAIXA</button></div>
    </div>
  );
}

export function PdvView({ tab, onTabChange }: { tab: PdvTab; onTabChange: (tab: PdvTab) => void }) {
  const storedSales = useStorageCollection<Sale>(SALES_KEY, []);
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const customers = useStorageCollection<Customer>(CUSTOMERS_KEY, demoCustomers);
  const stockEntries = useStorageCollection<StockEntry>(STOCK_KEY, []);
  const stockMovements = useStorageCollection<StockMovement>(STOCK_MOVEMENTS_KEY, []);
  const financialEntries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const deliveries = useStorageCollection<Delivery>(DELIVERIES_KEY, demoDeliveries);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="text-xs text-[#77756e]">PDV e vendas</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Caixa</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Registre vendas e acompanhe o histórico simulados.</p></div>
        <div className="flex gap-2">
          <button onClick={() => onTabChange("nova")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "nova" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>NOVA VENDA</button>
          <button onClick={() => onTabChange("vendas")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "vendas" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>HISTÓRICO <span className={tab === "vendas" ? "text-white/60" : "text-[#b0ada5]"}>({storedSales.length + demoSales.length})</span></button>
        </div>
      </div>
      {tab === "nova"
        ? <NovaVenda products={products} customers={customers} stockEntries={stockEntries} stockMovements={stockMovements} financialEntries={financialEntries} deliveries={deliveries} onGoHistory={() => onTabChange("vendas")} />
        : <Historico storedSales={storedSales} products={products} stockEntries={stockEntries} stockMovements={stockMovements} financialEntries={financialEntries} deliveries={deliveries} onNavigate={() => onTabChange("nova")} />}
    </div>
  );
}
