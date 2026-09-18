"use client";

import {
  CheckCircle2, FileText, MapPin, MessageCircle, Minus, Phone, Plus, Search, ShoppingCart, Trash2, User,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/data/products";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry } from "@/lib/finance";
import { Customer, CUSTOMERS_KEY, demoCustomers, demoProducts, RegisteredProduct, REGISTERED_PRODUCTS_KEY } from "@/lib/registrations";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement } from "@/lib/stock";
import { CartItem, createId, Quote, QUOTES_KEY, readStorage, Sale, SALES_KEY, writeStorage } from "@/lib/storage";
import { useStorageCollection } from "@/lib/use-storage-collection";

export type QuotesTab = "solicitacoes" | "novo";

export const demoQuotes: Quote[] = [
  { id: "ORC-1048", customer: "Marina Albuquerque", phone: "(11) 98821-4450", email: "", city: "Centro", notes: "", items: [{ productId: 2, quantity: 34 }], total: 5606.6, createdAt: "2026-09-17T10:20:00", status: "Novo" },
  { id: "ORC-1047", customer: "Studio Linha Arquitetura", phone: "(11) 97710-1234", email: "", city: "Jardins", notes: "", items: [{ productId: 1, quantity: 52 }], total: 6754.8, createdAt: "2026-09-17T09:10:00", status: "Em atendimento" },
  { id: "ORC-1046", customer: "Roberto Ferreira", phone: "(11) 96642-7741", email: "", city: "Vila Nova", notes: "", items: [{ productId: 4, quantity: 28 }], total: 2237.2, createdAt: "2026-09-16T15:40:00", status: "Enviado" },
];

const quoteStatuses = ["Novo", "Em atendimento", "Enviado", "Aprovado"] as const;
const editableQuoteStatuses = ["Novo", "Em atendimento", "Enviado"] as const;

const statusStyles: Record<Quote["status"], string> = {
  "Novo": "bg-[#fff0e8] text-[#b83c1d]",
  "Em atendimento": "bg-[#fff4d0] text-[#87630b]",
  "Enviado": "bg-[#e5edf7] text-[#315c88]",
  "Aprovado": "bg-[#dce8dc] text-[#4f684f]",
};

function productOf(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId);
}

function itemTotal(products: RegisteredProduct[], item: CartItem) {
  const product = productOf(products, item.productId);
  return (product?.price ?? 0) * item.quantity;
}

function quoteHasUnpriced(products: RegisteredProduct[], quote: Quote) {
  return quote.items.some((item) => productOf(products, item.productId)?.price === undefined);
}

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function whatsappLink(quote: Quote) {
  const digits = quote.phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `55${digits}` : digits;
  const text = encodeURIComponent(`Olá, ${quote.customer}! Sobre o orçamento ${quote.id} da Casa São José Acabamentos: podemos confirmar os itens e valores?`);
  return `https://wa.me/${number}?text=${text}`;
}

function StatusBadge({ status }: { status: Quote["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>{status}</span>;
}

function metric(quotes: Quote[]) {
  return {
    open: quotes.filter((quote) => quote.status === "Novo").length,
    progress: quotes.filter((quote) => quote.status === "Em atendimento").length,
    approved: quotes.filter((quote) => quote.status === "Aprovado").length,
    negotiation: quotes.filter((quote) => quote.status !== "Aprovado").reduce((sum, quote) => sum + quote.total, 0),
  };
}

function Solicitacoes({ storedQuotes, products, onNew }: { storedQuotes: Quote[]; products: RegisteredProduct[]; onNew: () => void }) {
  const stockEntries = useStorageCollection<StockEntry>(STOCK_KEY, []);
  const stockMovements = useStorageCollection<StockMovement>(STOCK_MOVEMENTS_KEY, []);
  const financialEntries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Todos" | Quote["status"]>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const quotes = [...storedQuotes, ...demoQuotes];
  const filtered = quotes.filter((quote) => {
    const term = search.trim().toLowerCase();
    return (!term || quote.customer.toLowerCase().includes(term) || quote.id.toLowerCase().includes(term) || quote.city.toLowerCase().includes(term)) && (status === "Todos" || quote.status === status);
  });
  const selected = quotes.find((quote) => quote.id === selectedId) ?? null;
  const isStored = selected ? storedQuotes.some((quote) => quote.id === selected.id) : false;
  const stats = metric(quotes);

  function updateStatus(id: string, next: Quote["status"]) {
    const quote = storedQuotes.find((item) => item.id === id);
    if (!quote || quote.convertedSaleId || quote.status === "Aprovado" || next === "Aprovado") return;
    writeStorage(QUOTES_KEY, storedQuotes.map((item) => item.id === id ? { ...item, status: next } : item));
  }

  function removeQuote(id: string) {
    writeStorage(QUOTES_KEY, storedQuotes.filter((quote) => quote.id !== id));
    setSelectedId(null);
    setConversionError(null);
  }

  function convertToSale(quote: Quote) {
    setConversionError(null);
    const currentQuotes = readStorage<Quote[]>(QUOTES_KEY, storedQuotes);
    const currentQuote = currentQuotes.find((item) => item.id === quote.id);
    if (!currentQuote || currentQuote.convertedSaleId || currentQuote.status === "Aprovado") return;

    const currentEntries = readStorage<StockEntry[]>(STOCK_KEY, stockEntries);
    const requested = new Map<number, number>();
    currentQuote.items.forEach((item) => requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity));
    const shortages = [...requested].flatMap(([productId, quantity]) => {
      const product = productOf(products, productId);
      if (!product) return [`Produto ${productId} indisponível`];
      const available = effectiveStock(currentEntries, product).quantity;
      return available < quantity ? [`${product.name} (disponível: ${available}, solicitado: ${quantity})`] : [];
    });
    if (shortages.length > 0) {
      setConversionError(`Estoque insuficiente para: ${shortages.join("; ")}.`);
      return;
    }

    const sales = readStorage<Sale[]>(SALES_KEY, []);
    const currentMovements = readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, stockMovements);
    const currentFinancial = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    const saleId = createId("VD");
    const createdAt = new Date().toISOString();
    const paidAt = localDateKey();
    const sale: Sale = {
      id: saleId,
      customerId: currentQuote.customerId,
      customer: currentQuote.customer,
      items: currentQuote.items,
      subtotal: currentQuote.total,
      discount: 0,
      total: currentQuote.total,
      payment: { method: "Pix" },
      status: "Separação",
      createdAt,
      cashier: "Ana",
    };
    const nextEntries = [...currentEntries];
    const movements: StockMovement[] = [];
    requested.forEach((quantity, productId) => {
      const product = productOf(products, productId);
      if (!product) return;
      const current = effectiveStock(nextEntries, product);
      const entry: StockEntry = { productId, quantity: current.quantity - quantity, min: current.min };
      const index = nextEntries.findIndex((item) => item.productId === productId);
      if (index >= 0) nextEntries[index] = entry; else nextEntries.push(entry);
      movements.push({ id: createId("MOV"), productId, type: "Saída", quantity, reason: `Venda ${saleId} · orçamento ${currentQuote.id}`, createdAt, user: "Ana" });
    });
    const financialEntry: FinancialEntry = {
      id: createId("FIN"),
      kind: "Receber",
      description: `Venda ${saleId} · Pix (simulado)`,
      party: currentQuote.customer,
      category: "Vendas",
      amount: currentQuote.total,
      dueAt: paidAt,
      paidAt,
      status: "Pago",
      sourceType: "Venda",
      sourceId: saleId,
      createdAt,
    };

    writeStorage(STOCK_KEY, nextEntries);
    writeStorage(STOCK_MOVEMENTS_KEY, [...movements, ...currentMovements]);
    writeStorage(SALES_KEY, [sale, ...sales]);
    writeStorage(FINANCIAL_KEY, [financialEntry, ...currentFinancial]);
    writeStorage(QUOTES_KEY, currentQuotes.map((item) => item.id === currentQuote.id ? { ...item, status: "Aprovado", convertedSaleId: saleId } : item));
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[[`Novos`, stats.open, "Aguardando atendimento"], [`Em atendimento`, stats.progress, "Em negociação"], ["Aprovados", stats.approved, "Convertidos em venda"], ["Em negociação", formatCurrency(stats.negotiation), "Valor em aberto"]].map(([label, value, hint]) => (
          <article key={label as string} className="rounded-lg border border-black/7 bg-white p-4"><p className="text-[11px] font-semibold text-[#77756e]">{label as string}</p><strong className="mt-2 block font-display text-2xl font-normal">{value as string}</strong><p className="mt-1 text-[10px] text-[#99968e]">{hint as string}</p></article>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 md:flex-row md:items-center">
            <div><h3 className="font-display text-xl">Solicitações</h3><p className="mt-1 text-[10px] text-[#88867e]">Pedidos do site e orçamentos criados no ERP</p></div>
            <div className="flex gap-2"><label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 px-3 md:w-48"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar..." /></label><select value={status} onChange={(event) => setStatus(event.target.value as "Todos" | Quote["status"])} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none"><option>Todos</option>{quoteStatuses.map((option) => <option key={option}>{option}</option>)}</select></div>
          </div>
          {filtered.length === 0 ? <div className="grid place-items-center p-12 text-center"><FileText size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum orçamento encontrado.</p></div> : <div className="divide-y divide-black/6">{filtered.map((quote) => (
            <button key={quote.id} onClick={() => { setSelectedId(quote.id); setConversionError(null); }} className={`grid w-full gap-2 p-4 text-left transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${selectedId === quote.id ? "bg-[#eef3fa]" : "hover:bg-[#f7f8fa]"}`}>
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef1f5] text-[10px] font-bold text-[#5f6b7a]">{quote.customer.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{quote.customer}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{quote.id} · {quote.city} · {quote.items.length} item(ns)</p></div></div>
              <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-xs font-bold">{quote.total > 0 ? formatCurrency(quote.total) : "Sob consulta"}</span><StatusBadge status={quote.status} /></div>
            </button>
          ))}</div>}
          <div className="border-t border-black/7 bg-[#f7f8fa] px-5 py-4"><button onClick={onNew} className="flex h-11 items-center gap-2 rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white"><Plus size={16} /> NOVO ORÇAMENTO</button></div>
        </div>

        {selected ? (
          <div className="rounded-lg border border-black/7 bg-white p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-[#ed1c24]">{selected.id}</p><h3 className="font-display mt-1 text-2xl leading-tight">{selected.customer}</h3><p className="mt-1 text-[10px] text-[#99968e]">{new Date(selected.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p></div><StatusBadge status={selected.status} /></div>
            <div className="mt-4 space-y-2 border-y border-black/7 py-4 text-xs text-[#77756e]"><p className="flex items-center gap-2"><Phone size={13} /> {selected.phone}</p>{selected.email && <p className="flex items-center gap-2"><User size={13} /> {selected.email}</p>}<p className="flex items-center gap-2"><MapPin size={13} /> {selected.city}</p></div>
            <div className="mt-4 divide-y divide-black/6">{selected.items.map((item) => { const product = productOf(products, item.productId); return (
              <div key={item.productId} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product?.name ?? `Produto ${item.productId}`}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{product?.price !== undefined ? `${formatCurrency(product.price)} / ${product.unit}` : "Preço sob consulta"}</p></div><span className="text-xs font-bold">{item.quantity}</span><span className="w-20 text-right text-xs font-bold">{product?.price !== undefined ? formatCurrency(itemTotal(products, item)) : "—"}</span></div>
            ); })}</div>
            <div className="mt-2 flex items-end justify-between border-t border-black/7 pt-4"><span className="text-xs font-semibold text-[#77756e]">Total{quoteHasUnpriced(products, selected) ? " (parcial)" : ""}</span><strong className="font-display text-2xl font-normal">{selected.total > 0 ? formatCurrency(selected.total) : "Sob consulta"}</strong></div>
            {selected.notes && <p className="mt-4 rounded-md bg-[#f7f8fa] p-3 text-[11px] leading-5 text-[#77756e]">“{selected.notes}”</p>}
            {isStored ? (
              <>
                <div className="mt-4"><label className="text-[10px] font-bold text-[#77756e] uppercase">Status<select value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value as Quote["status"])} disabled={Boolean(selected.convertedSaleId) || selected.status === "Aprovado"} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold outline-none disabled:bg-[#f7f8fa] disabled:text-[#77756e]">{selected.status === "Aprovado" && <option>Aprovado</option>}{editableQuoteStatuses.map((option) => <option key={option}>{option}</option>)}</select></label></div>
                <div className="mt-4 grid gap-2">
                  <a href={whatsappLink(selected)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#19a05a] text-xs font-bold text-white"><MessageCircle size={17} /> ENVIAR NO WHATSAPP</a>
                  <button onClick={() => convertToSale(selected)} disabled={Boolean(selected.convertedSaleId) || selected.status === "Aprovado" || quoteHasUnpriced(products, selected) || selected.total <= 0} className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#073f8c] text-xs font-bold text-white disabled:opacity-40"><ShoppingCart size={16} /> GERAR VENDA</button>
                  {conversionError && <p className="rounded-md bg-[#f5e4e4] p-3 text-[10px] font-semibold leading-4 text-[#9a3b3b]">{conversionError}</p>}
                  <button onClick={() => removeQuote(selected.id)} className="flex h-11 items-center justify-center gap-2 rounded-md border border-black/10 text-xs font-bold text-[#b83c1d]"><Trash2 size={15} /> EXCLUIR ORÇAMENTO</button>
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-md bg-[#f7f8fa] p-3 text-[10px] text-[#99968e]">Registro de demonstração — as ações ficam disponíveis nos orçamentos recebidos do site.</p>
            )}
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-black/10 bg-white p-8 text-center"><div><FileText size={26} className="mx-auto text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Selecione um orçamento</p><p className="mt-1 text-[10px] text-[#88867e]">Clique em uma solicitação para ver os detalhes e as ações.</p></div></div>
        )}
      </div>
    </div>
  );
}

function NovoOrcamento({ products, customers, onDone }: { products: RegisteredProduct[]; customers: Customer[]; onDone: () => void }) {
  const [form, setForm] = useState({ customer: "", phone: "", email: "", city: "", notes: "" });
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const filteredProducts = products.filter((product) => product.active).filter((product) => {
    const term = search.trim().toLowerCase();
    return !term || product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term);
  });
  const subtotal = items.reduce((sum, item) => sum + itemTotal(products, item), 0);
  const hasUnpriced = items.some((item) => productOf(products, item.productId)?.price === undefined);

  function selectCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;
    setForm((current) => ({ ...current, customer: customer.name, phone: customer.phone, email: customer.email, city: customer.city }));
  }

  function addItem(productId: number) {
    setItems((current) => current.some((item) => item.productId === productId) ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId, quantity: 1 }]);
  }

  function updateItem(productId: number, quantity: number) {
    if (quantity <= 0) return setItems((current) => current.filter((item) => item.productId !== productId));
    setItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function save() {
    if (!form.customer.trim() || !form.phone.trim() || !form.city.trim() || items.length === 0) return;
    const quotes = readStorage<Quote[]>(QUOTES_KEY, []);
    const currentCustomers = readStorage<Customer[]>(CUSTOMERS_KEY, customers);
    const normalizedName = form.customer.trim().toLocaleLowerCase("pt-BR");
    let customer = currentCustomers.find((item) => item.id === customerId)
      ?? currentCustomers.find((item) => item.name.trim().toLocaleLowerCase("pt-BR") === normalizedName);
    if (!customer) {
      customer = {
        id: createId("CLI"),
        name: form.customer.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        document: "",
        city: form.city.trim(),
        address: "",
        notes: "",
        active: true,
        createdAt: new Date().toISOString(),
      };
      writeStorage(CUSTOMERS_KEY, [customer, ...currentCustomers]);
    }
    const id = createId("ORC");
    const quote: Quote = { id, customerId: customer.id, ...form, customer: form.customer.trim(), phone: form.phone.trim(), email: form.email.trim(), city: form.city.trim(), notes: form.notes.trim(), items, total: subtotal, createdAt: new Date().toISOString(), status: "Novo" };
    writeStorage(QUOTES_KEY, [quote, ...quotes]);
    setSavedId(id);
    setCustomerId("");
    setItems([]);
    setForm({ customer: "", phone: "", email: "", city: "", notes: "" });
    setSearch("");
  }

  if (savedId) return (
    <div className="rounded-lg border border-black/7 bg-white p-8 text-center">
      <CheckCircle2 size={46} className="mx-auto text-[#19a05a]" />
      <h3 className="font-display mt-5 text-3xl">Orçamento {savedId} criado.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#77756e]">A solicitação entrou na lista com status “Novo” e já pode ser enviada ao cliente.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onDone} className="h-12 rounded-md bg-[#073f8c] px-6 text-xs font-bold text-white">VER SOLICITAÇÕES</button>
        <button onClick={() => setSavedId(null)} className="h-12 rounded-md border border-black/10 bg-white px-6 text-xs font-bold">NOVO ORÇAMENTO</button>
      </div>
    </div>
  );

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <div className="rounded-lg border border-black/7 bg-white p-5">
        <h3 className="font-display text-xl">Dados do cliente</h3>
        <div className="mt-5 grid gap-4">
          <label className="text-xs font-bold text-[#77756e] uppercase">Cliente cadastrado<select value={customerId} onChange={(event) => selectCustomer(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-medium normal-case outline-none focus:border-[#073f8c]"><option value="">Preencher novo cliente</option>{customers.filter((customer) => customer.active).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Nome *<input value={form.customer} onChange={(event) => { setCustomerId(""); setForm({ ...form, customer: event.target.value }); }} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Cliente" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#77756e] uppercase">WhatsApp *<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="(11) 00000-0000" /></label><label className="text-xs font-bold text-[#77756e] uppercase">Cidade *<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Cidade" /></label></div>
          <label className="text-xs font-bold text-[#77756e] uppercase">E-mail<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="voce@email.com" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Observações<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 min-h-24 w-full resize-none rounded-md border border-black/10 p-3 text-sm outline-none focus:border-[#073f8c]" placeholder="Prazo, entrega ou detalhes do projeto" /></label>
        </div>
      </div>

      <div className="rounded-lg border border-black/7 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 sm:flex-row sm:items-center"><div><h3 className="font-display text-xl">Itens do orçamento</h3><p className="mt-1 text-[10px] text-[#88867e]">Produtos sob consulta entram sem valor</p></div><label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 px-3 sm:w-52"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar produto..." /></label></div>
        <div className="max-h-72 divide-y divide-black/6 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex items-center gap-3 px-5 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[10px] text-[#88867e]">{product.brand} · {product.size}</p></div>{product.price !== undefined ? <span className="text-xs font-bold">{formatCurrency(product.price)}</span> : <span className="text-[9px] font-bold text-[#a8943a]">SOB CONSULTA</span>}<button onClick={() => addItem(product.id)} className="grid h-9 w-9 place-items-center rounded-md bg-[#073f8c] text-white hover:bg-[#ed1c24]" aria-label={`Adicionar ${product.name}`}><Plus size={16} /></button></div>
          ))}
        </div>
        <div className="border-t border-black/7 p-5">
          <div className="divide-y divide-black/6">{items.length === 0 ? <p className="py-4 text-center text-xs text-[#88867e]">Nenhum item adicionado.</p> : items.map((item) => { const product = productOf(products, item.productId); return (
            <div key={item.productId} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product?.name}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{product?.price !== undefined ? `${formatCurrency(product.price)} / ${product.unit}` : "Sob consulta"}</p></div><div className="flex h-9 items-center rounded-md border border-black/10"><button onClick={() => updateItem(item.productId, item.quantity - 1)} className="grid h-full w-8 place-items-center text-[#77756e]"><Minus size={13} /></button><span className="min-w-8 text-center text-xs font-bold">{item.quantity}</span><button onClick={() => updateItem(item.productId, item.quantity + 1)} className="grid h-full w-8 place-items-center text-[#77756e]"><Plus size={13} /></button></div><button onClick={() => updateItem(item.productId, 0)} className="grid h-8 w-8 place-items-center text-[#b0ada5] hover:text-[#b83c1d]"><Trash2 size={14} /></button></div>
          ); })}</div>
          <div className="mt-3 flex items-end justify-between border-t border-black/6 pt-4"><span className="text-xs font-semibold text-[#77756e]">Estimativa{hasUnpriced ? " (parcial)" : ""}</span><strong className="font-display text-2xl font-normal">{formatCurrency(subtotal)}</strong></div>
          <button onClick={save} disabled={!form.customer.trim() || !form.phone.trim() || !form.city.trim() || items.length === 0} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-sm font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><FileText size={18} /> SALVAR ORÇAMENTO</button>
        </div>
      </div>
    </div>
  );
}

export function QuotesView({ tab, onTabChange }: { tab: QuotesTab; onTabChange: (tab: QuotesTab) => void }) {
  const storedQuotes = useStorageCollection<Quote>(QUOTES_KEY, []);
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const customers = useStorageCollection<Customer>(CUSTOMERS_KEY, demoCustomers);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="text-xs text-[#77756e]">Orçamentos</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Solicitações</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Acompanhe pedidos do site e orçamentos feitos no balcão.</p></div>
        <div className="flex gap-2">
          <button onClick={() => onTabChange("solicitacoes")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "solicitacoes" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>SOLICITAÇÕES</button>
          <button onClick={() => onTabChange("novo")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "novo" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>NOVO ORÇAMENTO</button>
        </div>
      </div>
      {tab === "solicitacoes" ? <Solicitacoes storedQuotes={storedQuotes} products={products} onNew={() => onTabChange("novo")} /> : <NovoOrcamento products={products} customers={customers} onDone={() => onTabChange("solicitacoes")} />}
    </div>
  );
}
