"use client";

import {
  AlertTriangle, Building2, CheckCircle2, ChevronDown, ClipboardList, Clock, PackageCheck, Plus, Save, Search, Send, Trash2, Truck, X,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { formatCurrency } from "@/data/products";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry } from "@/lib/finance";
import { demoProducts, demoSuppliers, REGISTERED_PRODUCTS_KEY, RegisteredProduct, Supplier, SUPPLIERS_KEY } from "@/lib/registrations";
import { createId, getBrowserStorageSnapshot, parseStorageArray, readStorage, subscribeToStorage, writeStorage } from "@/lib/storage";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement, stockStatus } from "@/lib/stock";
import { demoPurchases, PURCHASES_KEY, Purchase, PurchaseItem, PurchaseStatus, purchaseTotal } from "@/lib/purchases";
import { useStorageCollection } from "@/lib/use-storage-collection";

export type ComprasTab = "pedidos" | "novo" | "fornecedores";

const statusStyles: Record<PurchaseStatus, string> = {
  "Rascunho": "bg-[#fff4d0] text-[#87630b]",
  "Enviado": "bg-[#e5edf7] text-[#315c88]",
  "Recebido": "bg-[#dce8dc] text-[#4f684f]",
  "Cancelado": "bg-[#f5e4e4] text-[#9a3b3b]",
};

function StatusBadge({ status }: { status: PurchaseStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>{status}</span>;
}

function productName(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId)?.name ?? `Produto ${productId}`;
}

function suggestedCost(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId)?.cost ?? 0;
}

function Pedidos({ purchases, products, entries, onSend, onReceive, onCancel, onNew, onQuickAdd }: { purchases: Purchase[]; products: RegisteredProduct[]; entries: StockEntry[]; onSend: (id: string) => void; onReceive: (purchase: Purchase) => void; onCancel: (id: string) => void; onNew: () => void; onQuickAdd: (item: PurchaseItem) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const lowStock = products
    .filter((product) => product.active)
    .map((product) => ({ product, ...effectiveStock(entries, product) }))
    .map((row) => ({ ...row, suggested: Math.max(row.min * 2 - row.quantity, row.min) }))
    .filter((row) => stockStatus(row.quantity, row.min) !== "Normal")
    .sort((a, b) => a.quantity - b.quantity);

  const open = purchases.filter((purchase) => purchase.status === "Rascunho" || purchase.status === "Enviado");
  const transit = purchases.filter((purchase) => purchase.status === "Enviado");
  const received = purchases.filter((purchase) => purchase.status === "Recebido");
  const openValue = open.reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);

  const cards = [
    { label: "Pedidos em aberto", value: String(open.length), hint: "rascunhos e enviados", Icon: ClipboardList, tone: "bg-[#e5edf7] text-[#315c88]" },
    { label: "Em trânsito", value: String(transit.length), hint: "aguardando recebimento", Icon: Truck, tone: "bg-[#fff4d0] text-[#87630b]" },
    { label: "Valor em aberto", value: formatCurrency(openValue), hint: "inclui frete", Icon: Clock, tone: "bg-[#fff0e8] text-[#b83c1d]" },
    { label: "Recebidos", value: String(received.length), hint: "já lançados no estoque", Icon: PackageCheck, tone: "bg-[#dce8dc] text-[#4f684f]" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, hint, Icon, tone }) => (
          <article key={label} className="rounded-lg border border-black/7 bg-white p-4"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label}</p><span className={`grid h-7 w-7 place-items-center rounded-md ${tone}`}><Icon size={14} /></span></div><strong className="font-display mt-3 block truncate text-2xl font-normal">{value}</strong><p className="mt-1 text-[9px] text-[#99968e]">{hint}</p></article>
        ))}
      </div>

      {lowStock.length > 0 && (
        <article className="mt-4 rounded-lg border border-[#f0dcb4] bg-[#fffaf0] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><AlertTriangle size={16} className="text-[#b8860b]" /><h3 className="font-display text-lg">Reposição sugerida</h3></div><button onClick={onNew} className="text-[10px] font-bold text-[#ed1c24]">MONTAR PEDIDO</button></div>
          <p className="mt-1 text-[10px] text-[#96793f]">Itens abaixo do mínimo definido no estoque, com quantidade sugerida para recompor o dobro do mínimo.</p>
          <div className="mt-3 divide-y divide-[#f0e3c8]">
            {lowStock.map(({ product, quantity, min, suggested }) => (
              <div key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1 basis-44"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[9px] text-[#96793f]">Atual {quantity} {product.unit} · mínimo {min} {product.unit}</p></div>
                <p className="text-xs font-bold text-[#b8860b]">sugerir {suggested} {product.unit}</p>
                <button onClick={() => onQuickAdd({ productId: product.id, quantity: suggested, cost: suggestedCost(products, product.id) })} className="flex h-9 items-center gap-1.5 rounded-md bg-[#073f8c] px-3 text-[10px] font-bold text-white hover:bg-[#ed1c24]"><Plus size={13} /> INCLUIR</button>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="flex items-center justify-between border-b border-black/7 p-5"><div><h3 className="font-display text-xl">Pedidos de compra</h3><p className="mt-1 text-[10px] text-[#88867e]">Acompanhe cotações, envio e recebimento no estoque</p></div><button onClick={onNew} className="flex h-10 items-center gap-2 rounded-md bg-[#ed1c24] px-4 text-xs font-bold text-white hover:bg-[#bd1017]"><Plus size={15} /> NOVO PEDIDO</button></div>
        <div className="hidden grid-cols-[.9fr_1.3fr_1fr_.8fr_.9fr_auto] gap-4 border-b border-black/6 px-5 py-3 text-[9px] font-bold tracking-wider text-[#99968e] uppercase lg:grid"><span>Pedido</span><span>Fornecedor</span><span>Previsão</span><span>Valor</span><span>Status</span><span /></div>
        {purchases.length === 0 ? <div className="grid place-items-center p-12 text-center"><ClipboardList size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum pedido de compra.</p><p className="mt-1 text-[10px] text-[#88867e]">Monte um pedido ou use a reposição sugerida.</p></div> : <div className="divide-y divide-black/6">
          {purchases.map((purchase) => (
            <div key={purchase.id}>
              <div className="grid grid-cols-2 gap-3 px-5 py-4 text-xs lg:grid-cols-[.9fr_1.3fr_1fr_.8fr_.9fr_auto] lg:items-center lg:gap-4">
                <div className="flex items-center gap-2"><button onClick={() => setExpanded(expanded === purchase.id ? null : purchase.id)} className="grid h-7 w-7 place-items-center rounded-md border border-black/10 text-[#77756e]" aria-label="Detalhar"><ChevronDown size={14} className={expanded === purchase.id ? "rotate-180 transition-transform" : "transition-transform"} /></button><span className="font-semibold text-[#ed1c24]">{purchase.id}</span></div>
                <div className="min-w-0"><p className="truncate font-semibold">{purchase.supplier}</p><p className="mt-0.5 text-[9px] text-[#99968e]">{purchase.items.length} item(ns) · {new Date(purchase.createdAt).toLocaleDateString("pt-BR")}</p></div>
                <p className="text-[10px] text-[#77756e]">{purchase.expectedAt ? new Date(`${purchase.expectedAt}T12:00:00`).toLocaleDateString("pt-BR") : "a definir"}</p>
                <p className="text-right font-semibold lg:text-left">{formatCurrency(purchaseTotal(purchase))}</p>
                <div className="col-span-2 lg:col-span-1"><StatusBadge status={purchase.status} /></div>
                <div className="col-span-2 flex flex-wrap justify-end gap-2 lg:col-span-1">
                  {purchase.status === "Rascunho" && <button onClick={() => onSend(purchase.id)} className="flex h-8 items-center gap-1.5 rounded-md bg-[#073f8c] px-3 text-[10px] font-bold text-white hover:bg-[#ed1c24]"><Send size={12} /> ENVIAR</button>}
                  {purchase.status === "Enviado" && <button onClick={() => onReceive(purchase)} className="flex h-8 items-center gap-1.5 rounded-md bg-[#2f7d4f] px-3 text-[10px] font-bold text-white hover:bg-[#256640]"><CheckCircle2 size={12} /> RECEBER</button>}
                  {(purchase.status === "Rascunho" || purchase.status === "Enviado") && <button onClick={() => onCancel(purchase.id)} className="flex h-8 items-center gap-1.5 rounded-md border border-black/10 px-3 text-[10px] font-bold text-[#77756e] hover:border-[#ed1c24] hover:text-[#ed1c24]"><X size={12} /> CANCELAR</button>}
                </div>
              </div>
              {expanded === purchase.id && <div className="border-t border-black/6 bg-[#f7f8fa] px-5 py-4">
                <div className="sm:grid sm:grid-cols-[1.8fr_.6fr_.7fr_.7fr] sm:gap-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Item</p><p className="hidden text-[9px] font-bold tracking-wider text-[#99968e] uppercase sm:block">Qtd.</p><p className="hidden text-[9px] font-bold tracking-wider text-[#99968e] uppercase sm:block">Custo</p><p className="hidden text-[9px] font-bold tracking-wider text-[#99968e] uppercase sm:block">Subtotal</p></div>
                <div className="mt-2 divide-y divide-black/6">{purchase.items.map((item) => (
                   <div key={item.productId} className="grid gap-1 py-2 text-xs sm:grid-cols-[1.8fr_.6fr_.7fr_.7fr] sm:gap-4"><span className="font-semibold">{productName(products, item.productId)}</span><span className="text-[#77756e]">{item.quantity}</span><span className="text-[#77756e]">{formatCurrency(item.cost)}</span><span className="font-semibold">{formatCurrency(item.quantity * item.cost)}</span></div>
                ))}</div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/8 pt-3 text-[10px] text-[#77756e]"><span>Frete: <strong className="text-[#282824]">{formatCurrency(purchase.freight)}</strong></span><span>Total do pedido: <strong className="text-[#282824]">{formatCurrency(purchaseTotal(purchase))}</strong></span></div>
                {purchase.notes && <p className="mt-2 text-[10px] text-[#88867e]">Obs.: {purchase.notes}</p>}
              </div>}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

function NovoPedido({ nextId, products, suppliers, presetSupplierId, presetItems, onCreate }: { nextId: string; products: RegisteredProduct[]; suppliers: Supplier[]; presetSupplierId?: string; presetItems?: PurchaseItem[]; onCreate: (purchase: Purchase) => void }) {
  const [supplierId, setSupplierId] = useState(() => suppliers.some((item) => item.id === presetSupplierId) ? presetSupplierId ?? "" : suppliers[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState("");
  const [freight, setFreight] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>(presetItems ?? []);
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState(String(suggestedCost(products, products[0]?.id ?? 0)));
  const [message, setMessage] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
  const freightValue = Math.max(0, Number(freight.replace(",", ".")) || 0);
  const selectedSupplier = suppliers.find((item) => item.id === supplierId);

  function selectProduct(id: number) {
    setProductId(id);
    setCost(String(suggestedCost(products, id)));
  }

  function addItem() {
    const parsed = Math.floor(Number(quantity) || 0);
    const parsedCost = Math.max(0, Number(cost.replace(",", ".")) || 0);
    if (parsed <= 0 || !products.some((product) => product.id === productId)) return;
    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      return existing ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + parsed, cost: parsedCost } : item) : [...current, { productId, quantity: parsed, cost: parsedCost }];
    });
    setQuantity("");
    setMessage(null);
  }

  function save(status: PurchaseStatus) {
    if (items.length === 0 || !selectedSupplier) return;
    onCreate({ id: nextId, supplierId: selectedSupplier.id, supplier: selectedSupplier.name, items, freight: freightValue, status, createdAt: new Date().toISOString(), expectedAt, notes });
    setItems([]);
    setFreight("");
    setNotes("");
    setMessage(status === "Enviado" ? `Pedido ${nextId} enviado para ${selectedSupplier.name}.` : `Rascunho ${nextId} salvo para ${selectedSupplier.name}.`);
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-lg border border-black/7 bg-white p-5">
        <h3 className="font-display text-xl">Novo pedido de compra</h3>
        <p className="mt-1 text-[10px] text-[#88867e]">Selecione o fornecedor, inclua os itens e envie ou salve como rascunho</p>
        {message && <div className="mt-4 flex items-start gap-3 rounded-md bg-[#dce8dc] p-3 text-xs text-[#4f684f]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><p>{message}</p></div>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#77756e] uppercase sm:col-span-2">Fornecedor<select value={supplierId} onChange={(event) => { setSupplierId(event.target.value); setMessage(null); }} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-[#073f8c]">{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}</select></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Previsão de entrega<input type="date" value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Frete (R$)<input inputMode="decimal" value={freight} onChange={(event) => setFreight(event.target.value.replace(/[^\d.,]/g, ""))} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="0,00" /></label>
        </div>
        <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8fa] p-4">
          <p className="text-[10px] font-bold tracking-wider text-[#99968e] uppercase">Adicionar item</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.5fr_.6fr_.7fr_auto]">
            <label className="text-[10px] font-bold text-[#77756e] uppercase">Produto<select value={productId} onChange={(event) => selectProduct(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-black/10 bg-white px-2 text-xs font-medium outline-none focus:border-[#073f8c]">{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.size}</option>)}</select></label>
            <label className="text-[10px] font-bold text-[#77756e] uppercase">Qtd.<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))} className="mt-1.5 h-10 w-full rounded-md border border-black/10 px-2 text-xs font-semibold outline-none focus:border-[#073f8c]" placeholder="0" /></label>
            <label className="text-[10px] font-bold text-[#77756e] uppercase">Custo un.<input inputMode="decimal" value={cost} onChange={(event) => setCost(event.target.value.replace(/[^\d.,]/g, ""))} className="mt-1.5 h-10 w-full rounded-md border border-black/10 px-2 text-xs font-semibold outline-none focus:border-[#073f8c]" /></label>
            <button onClick={addItem} disabled={products.length === 0} className="flex h-10 items-center justify-center gap-1.5 self-end rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white enabled:hover:bg-[#ed1c24] disabled:opacity-40"><Plus size={14} /> ADD</button>
          </div>
        </div>
        <div className="mt-4 divide-y divide-black/6 rounded-md border border-black/8">
          {items.length === 0 ? <p className="p-4 text-xs text-[#88867e]">Nenhum item no pedido.</p> : items.map((item) => (
             <div key={item.productId} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{productName(products, item.productId)}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{item.quantity} × {formatCurrency(item.cost)} = {formatCurrency(item.quantity * item.cost)}</p></div><button onClick={() => setItems((current) => current.filter((row) => row.productId !== item.productId))} className="grid h-8 w-8 place-items-center rounded-md border border-black/10 text-[#77756e] hover:border-[#ed1c24] hover:text-[#ed1c24]" aria-label="Remover"><Trash2 size={14} /></button></div>
          ))}
        </div>
        <label className="mt-4 block text-xs font-bold text-[#77756e] uppercase">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-2 w-full rounded-md border border-black/10 px-3 py-2 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Prazo, condição de pagamento, transportadora..." /></label>
        <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => save("Rascunho")} disabled={items.length === 0 || !selectedSupplier} className="flex h-12 items-center justify-center gap-2 rounded-md border border-black/10 text-sm font-bold text-[#55534c] enabled:hover:border-[#073f8c] enabled:hover:text-[#073f8c] disabled:opacity-40"><Save size={16} /> SALVAR RASCUNHO</button><button onClick={() => save("Enviado")} disabled={items.length === 0 || !selectedSupplier} className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-sm font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><Send size={16} /> ENVIAR PEDIDO</button></div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-black/7 bg-white p-5">
          <p className="text-[10px] font-bold tracking-wider text-[#99968e] uppercase">Resumo</p>
          <h3 className="font-display mt-1 text-2xl">{selectedSupplier?.name ?? ""}</h3>
          {selectedSupplier && <p className="mt-1 text-[10px] text-[#88867e]">{selectedSupplier.contact} · {selectedSupplier.city}</p>}
          <div className="mt-5 space-y-3 text-xs">
            <div className="flex items-center justify-between"><span className="text-[#77756e]">Itens</span><span className="font-bold">{items.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-[#77756e]">Subtotal</span><span className="font-bold">{formatCurrency(subtotal)}</span></div>
            <div className="flex items-center justify-between"><span className="text-[#77756e]">Frete</span><span className="font-bold">{formatCurrency(freightValue)}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/7 pt-4"><span className="text-xs text-[#77756e]">Total do pedido</span><span className="font-display text-2xl text-[#073f8c]">{formatCurrency(subtotal + freightValue)}</span></div>
          <p className="mt-4 text-center text-[10px] text-[#99968e]">Pedido demonstrativo. O recebimento lança os itens no estoque.</p>
        </div>
        <div className="rounded-lg border border-black/7 bg-white p-5">
          <h4 className="font-display text-lg">Fornecedores cadastrados</h4>
          <div className="mt-3 divide-y divide-black/6">{suppliers.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e5edf7] text-[#315c88]"><Building2 size={16} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold">{item.name}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{item.categories.join(" · ")}</p></div></div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

function Fornecedores({ purchases, suppliers, onNew }: { purchases: Purchase[]; suppliers: Supplier[]; onNew: (supplierId: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = suppliers.filter((supplier) => {
    const term = search.trim().toLowerCase();
    return !term || supplier.name.toLowerCase().includes(term) || supplier.city.toLowerCase().includes(term) || supplier.categories.some((category) => category.toLowerCase().includes(term));
  });

  return (
    <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 md:flex-row md:items-center"><div><h3 className="font-display text-xl">Fornecedores</h3><p className="mt-1 text-[10px] text-[#88867e]">Parceiros cadastrados para o protótipo</p></div><label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 px-3 md:w-60"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar fornecedor..." /></label></div>
      <div className="divide-y divide-black/6">
        {filtered.map((supplier) => {
          const history = purchases.filter((purchase) => (purchase.supplierId ? purchase.supplierId === supplier.id : purchase.supplier === supplier.name) && purchase.status !== "Cancelado");
          const total = history.reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);
          return (
            <div key={supplier.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#e5edf7] text-[#315c88]"><Building2 size={19} /></span>
              <div className="min-w-0 flex-1 basis-52"><p className="truncate text-sm font-semibold">{supplier.name}</p><p className="mt-1 text-[10px] text-[#88867e]">{supplier.contact} · {supplier.city}</p><div className="mt-1.5 flex flex-wrap gap-1">{supplier.categories.map((category) => <span key={category} className="rounded-full bg-[#f1f1ee] px-2 py-0.5 text-[9px] font-semibold text-[#77756e]">{category}</span>)}</div></div>
              <div className="text-right"><p className="text-[9px] tracking-wider text-[#99968e] uppercase">Pedidos</p><p className="text-sm font-bold">{history.length}</p></div>
              <div className="text-right"><p className="text-[9px] tracking-wider text-[#99968e] uppercase">Total</p><p className="text-sm font-bold">{formatCurrency(total)}</p></div>
              {supplier.active && <button onClick={() => onNew(supplier.id)} className="flex h-10 items-center gap-1.5 rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white hover:bg-[#ed1c24]"><Plus size={14} /> PEDIDO</button>}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="grid place-items-center p-12 text-center"><Building2 size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum fornecedor encontrado.</p></div>}
      </div>
    </div>
  );
}

export function PurchasesView({ tab, onTabChange }: { tab: ComprasTab; onTabChange: (tab: ComprasTab) => void }) {
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const suppliers = useStorageCollection<Supplier>(SUPPLIERS_KEY, demoSuppliers);
  const financialEntries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const serializedPurchases = useSyncExternalStore(subscribeToStorage, () => getBrowserStorageSnapshot(PURCHASES_KEY), () => "[]");
  const serializedEntries = useSyncExternalStore(subscribeToStorage, () => getBrowserStorageSnapshot(STOCK_KEY), () => "[]");
  const serializedMovements = useSyncExternalStore(subscribeToStorage, () => getBrowserStorageSnapshot(STOCK_MOVEMENTS_KEY), () => "[]");
  const storedPurchases = useMemo(() => parseStorageArray<Purchase>(serializedPurchases), [serializedPurchases]);
  const entries = useMemo(() => parseStorageArray<StockEntry>(serializedEntries), [serializedEntries]);
  const movements = useMemo(() => parseStorageArray<StockMovement>(serializedMovements), [serializedMovements]);
  const [draft, setDraft] = useState<{ supplierId?: string; items?: PurchaseItem[]; seed: number } | null>(null);

  const purchases = [...demoPurchases.filter((demo) => !storedPurchases.some((saved) => saved.id === demo.id)), ...storedPurchases].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeProducts = products.filter((product) => product.active);
  const activeSuppliers = suppliers.filter((supplier) => supplier.active);
  const nextId = `CMP-${Math.max(5000, ...purchases.map((purchase) => Number(purchase.id.replace(/\D/g, "")) || 0)) + 1}`;

  function upsert(purchase: Purchase) {
    const current = readStorage<Purchase[]>(PURCHASES_KEY, storedPurchases);
    const exists = current.some((saved) => saved.id === purchase.id);
    writeStorage(PURCHASES_KEY, exists ? current.map((saved) => saved.id === purchase.id ? purchase : saved) : [purchase, ...current]);
    if (purchase.status === "Enviado") createPayable(purchase);
  }

  function createPayable(purchase: Purchase) {
    const current = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    if (current.some((entry) => entry.sourceType === "Compra" && entry.sourceId === purchase.id)) return;
    const entry: FinancialEntry = {
      id: createId("FIN"),
      kind: "Pagar",
      description: `Compra ${purchase.id}`,
      party: purchase.supplier,
      category: "Fornecedores",
      amount: purchaseTotal(purchase),
      dueAt: purchase.expectedAt || new Date().toISOString().slice(0, 10),
      status: "Pendente",
      sourceType: "Compra",
      sourceId: purchase.id,
      createdAt: new Date().toISOString(),
    };
    writeStorage(FINANCIAL_KEY, [entry, ...current]);
  }

  function cancelPayable(id: string) {
    const current = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    const updated = current.map((entry): FinancialEntry => entry.sourceType === "Compra" && entry.sourceId === id
      ? { ...entry, status: "Cancelado", paidAt: undefined }
      : entry);
    if (updated.some((entry, index) => entry !== current[index])) writeStorage(FINANCIAL_KEY, updated);
  }

  function setStatus(id: string, status: PurchaseStatus) {
    const current = readStorage<Purchase[]>(PURCHASES_KEY, storedPurchases);
    const saved = current.find((purchase) => purchase.id === id);
    const purchase = saved ?? demoPurchases.find((item) => item.id === id);
    if (!purchase) return;
    if (saved) {
      writeStorage(PURCHASES_KEY, current.map((item) => item.id === id ? { ...item, status } : item));
    } else {
      writeStorage(PURCHASES_KEY, [{ ...purchase, status }, ...current]);
    }
    if (status === "Enviado") createPayable(purchase);
    if (status === "Cancelado") cancelPayable(id);
  }

  function receive(purchase: Purchase) {
    const currentPurchases = readStorage<Purchase[]>(PURCHASES_KEY, storedPurchases);
    const currentPurchase = currentPurchases.find((item) => item.id === purchase.id) ?? demoPurchases.find((item) => item.id === purchase.id);
    if (!currentPurchase || currentPurchase.status !== "Enviado") return;
    const nextEntries = [...readStorage<StockEntry[]>(STOCK_KEY, entries)];
    const nextMovements = [...readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, movements)];
    currentPurchase.items.forEach((item) => {
      const product = products.find((row) => row.id === item.productId);
      if (!product) return;
      const current = effectiveStock(nextEntries, product);
      const entry: StockEntry = { productId: item.productId, quantity: current.quantity + item.quantity, min: current.min };
      const at = nextEntries.findIndex((row) => row.productId === item.productId);
      if (at >= 0) nextEntries[at] = entry; else nextEntries.push(entry);
      nextMovements.unshift({ id: createId("MOV"), productId: item.productId, type: "Entrada", quantity: item.quantity, reason: `Compra ${currentPurchase.id} · ${currentPurchase.supplier}`, createdAt: new Date().toISOString(), user: "Ana" });
    });
    writeStorage(STOCK_KEY, nextEntries);
    writeStorage(STOCK_MOVEMENTS_KEY, nextMovements);
    setStatus(currentPurchase.id, "Recebido");
  }

  function openNew(input?: { supplierId?: string; items?: PurchaseItem[] }) {
    setDraft({ ...input, seed: Date.now() });
    onTabChange("novo");
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="text-xs text-[#77756e]">Suprimentos</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Compras</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Pedidos a fornecedores com entrada automática no estoque.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onTabChange("pedidos")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "pedidos" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>PEDIDOS</button>
          <button onClick={() => onTabChange("novo")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "novo" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>NOVO PEDIDO</button>
          <button onClick={() => onTabChange("fornecedores")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "fornecedores" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>FORNECEDORES</button>
        </div>
      </div>
      {tab === "pedidos" ? <Pedidos purchases={purchases} products={products} entries={entries} onSend={(id) => setStatus(id, "Enviado")} onReceive={receive} onCancel={(id) => setStatus(id, "Cancelado")} onNew={() => openNew()} onQuickAdd={(item) => openNew({ items: [item] })} /> : tab === "novo" ? <NovoPedido key={draft?.seed ?? 0} nextId={nextId} products={activeProducts} suppliers={activeSuppliers} presetSupplierId={draft?.supplierId} presetItems={draft?.items} onCreate={upsert} /> : <Fornecedores purchases={purchases} suppliers={suppliers} onNew={(supplierId) => openNew({ supplierId })} />}
    </div>
  );
}
