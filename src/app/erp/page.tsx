"use client";

import Link from "next/link";
import {
  ArrowUpRight, Bell, Boxes, ChevronDown, CircleDollarSign,
  ClipboardList, FileText, House, LayoutDashboard, Menu, PackageCheck, Plus, Receipt,
  RotateCcw, Search, ShoppingBag, Store, Truck, Users, WalletCards,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { formatCurrency } from "@/data/products";
import { CART_KEY, getBrowserStorageSnapshot, Order, ORDERS_KEY, parseStorageArray, Quote, QUOTES_KEY, removeStorage, Sale, SALES_KEY, SHOP_CART_KEY, subscribeToStorage, writeStorage } from "@/lib/storage";
import { BrandLogo } from "@/components/brand-logo";
import { PdvView, PdvTab, demoSales } from "@/components/erp/pdv-view";
import { QuotesView, QuotesTab, demoQuotes } from "@/components/erp/quotes-view";
import { StockView, StockTab } from "@/components/erp/stock-view";
import { PurchasesView, ComprasTab } from "@/components/erp/purchases-view";
import { InventoryView } from "@/components/erp/inventory-view";
import { DeliveriesView } from "@/components/erp/deliveries-view";
import { FinanceView } from "@/components/erp/finance-view";
import { RegistrationsView } from "@/components/erp/registrations-view";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, stockStatus } from "@/lib/stock";
import { PURCHASES_KEY } from "@/lib/purchases";
import { CUSTOMERS_KEY, demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct, SUPPLIERS_KEY } from "@/lib/registrations";
import { INVENTORIES_KEY } from "@/lib/inventory";
import { DELIVERIES_KEY, Delivery, demoDeliveries } from "@/lib/deliveries";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry } from "@/lib/finance";
import { useStorageCollection } from "@/lib/use-storage-collection";

const navItems = [
  { icon: LayoutDashboard, label: "Visão geral", view: "overview" },
  { icon: CircleDollarSign, label: "PDV e vendas", view: "pdv" },
  { icon: FileText, label: "Orçamentos", view: "quotes" },
  { icon: Boxes, label: "Estoque", view: "stock" },
  { icon: PackageCheck, label: "Compras", view: "compras" },
  { icon: ClipboardList, label: "Inventário", view: "inventory" },
  { icon: Truck, label: "Entregas", view: "deliveries" },
  { icon: WalletCards, label: "Financeiro", view: "finance" },
  { icon: Users, label: "Cadastros", view: "registrations" },
] as const;

type ErpView = typeof navItems[number]["view"];

const viewTitles: Record<ErpView, string> = {
  overview: "Visão geral",
  pdv: "PDV e vendas",
  quotes: "Orçamentos",
  stock: "Estoque",
  compras: "Compras",
  inventory: "Inventário",
  deliveries: "Entregas",
  finance: "Financeiro",
  registrations: "Cadastros",
};

const chartData = [42, 55, 49, 72, 66, 88, 78, 95, 70, 102, 91, 116, 108, 126];

function StatusBadge({ status }: { status: Quote["status"] | string }) {
  const style = status === "Novo" ? "bg-[#fff0e8] text-[#b83c1d]" : status === "Aprovado" || status === "Concluída" ? "bg-[#dce8dc] text-[#4f684f]" : status === "Enviado" || status === "Entrega" ? "bg-[#e5edf7] text-[#315c88]" : status === "Cancelada" ? "bg-[#f5e4e4] text-[#9a3b3b]" : "bg-[#fff4d0] text-[#87630b]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>{status}</span>;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("Este mês");
  const [view, setView] = useState<ErpView>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pdvTab, setPdvTab] = useState<PdvTab>("nova");
  const [quotesTab, setQuotesTab] = useState<QuotesTab>("solicitacoes");
  const [stockTab, setStockTab] = useState<StockTab>("posicao");
  const [comprasTab, setComprasTab] = useState<ComprasTab>("pedidos");
  const serializedQuotes = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(QUOTES_KEY),
    () => "[]",
  );
  const storedQuotes = useMemo(() => parseStorageArray<Quote>(serializedQuotes), [serializedQuotes]);
  const serializedOrders = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(ORDERS_KEY),
    () => "[]",
  );
  const orders = useMemo(() => parseStorageArray<Order>(serializedOrders), [serializedOrders]);
  const serializedSales = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(SALES_KEY),
    () => "[]",
  );
  const storedSales = useMemo(() => parseStorageArray<Sale>(serializedSales), [serializedSales]);
  const serializedStock = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(STOCK_KEY),
    () => "[]",
  );
  const stockEntries = useMemo(() => parseStorageArray<StockEntry>(serializedStock), [serializedStock]);
  const registeredProducts = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const financialEntries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const deliveries = useStorageCollection<Delivery>(DELIVERIES_KEY, demoDeliveries);

  const quotes = [...storedQuotes, ...demoQuotes];
  const sales = [...storedSales, ...demoSales];
  const lowStock = registeredProducts
    .filter((product) => product.active)
    .map((product) => ({ product, ...effectiveStock(stockEntries, product) }))
    .filter((row) => stockStatus(row.quantity, row.min) !== "Normal")
    .sort((a, b) => a.quantity - b.quantity)
  const onlineTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const onlinePickups = orders.filter((order) => order.fulfillment === "Retirada").length;
  const onlineDeliveries = orders.length - onlinePickups;
  const validFinancial = financialEntries.filter((entry) => entry.status !== "Cancelado");
  const received = validFinancial.filter((entry) => entry.kind === "Receber" && entry.status === "Pago").reduce((sum, entry) => sum + entry.amount, 0);
  const paid = validFinancial.filter((entry) => entry.kind === "Pagar" && entry.status === "Pago").reduce((sum, entry) => sum + entry.amount, 0);
  const receivable = validFinancial.filter((entry) => entry.kind === "Receber" && entry.status !== "Pago").reduce((sum, entry) => sum + entry.amount, 0);
  const validSales = sales.filter((sale) => sale.status !== "Cancelada");
  const salesTotal = validSales.reduce((sum, sale) => sum + sale.total, 0) + onlineTotal;
  const ticketAverage = validSales.length + orders.length > 0 ? salesTotal / (validSales.length + orders.length) : 0;
  const monthlyGoal = 250000;
  const goalProgress = Math.min(100, Math.round((salesTotal / monthlyGoal) * 100));
  const nextDeliveries = deliveries
    .filter((delivery) => delivery.status !== "Entregue" && delivery.status !== "Cancelada")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 3);

  function updateStatus(id: string, status: Quote["status"]) {
    const localQuote = storedQuotes.find((quote) => quote.id === id);
    if (!localQuote) return;
    const next = storedQuotes.map((quote) => quote.id === id ? { ...quote, status } : quote);
    writeStorage(QUOTES_KEY, next);
  }

  function resetSimulation() {
    removeStorage([
      CART_KEY, SHOP_CART_KEY, QUOTES_KEY, ORDERS_KEY, SALES_KEY, STOCK_KEY,
      STOCK_MOVEMENTS_KEY, PURCHASES_KEY, INVENTORIES_KEY, DELIVERIES_KEY,
      FINANCIAL_KEY, REGISTERED_PRODUCTS_KEY, CUSTOMERS_KEY, SUPPLIERS_KEY,
    ]);
  }

  function navigate(next: ErpView) {
    setView(next);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f1f5f8] text-[#282824] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#073f8c] text-white lg:flex">
        <div className="flex h-20 items-center border-b border-white/8 px-5"><BrandLogo inverse /></div>
        <nav className="flex-1 overflow-y-auto px-3 py-6"><p className="px-3 pb-3 text-[9px] font-bold tracking-[.18em] text-white/30 uppercase">Operação</p>{navItems.map(({ icon: NavIcon, label, view: itemView }) => <button key={itemView} onClick={() => navigate(itemView)} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${view === itemView ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}><NavIcon size={18} /> {label}{label === "Orçamentos" ? <span className="ml-auto rounded-full bg-[#ed1c24] px-2 py-0.5 text-[9px] font-bold text-white">{quotes.filter((quote) => quote.status === "Novo").length}</span> : label === "Estoque" && lowStock.length > 0 ? <span className="ml-auto rounded-full bg-[#fff4d0] px-2 py-0.5 text-[9px] font-bold text-[#87630b]">{lowStock.length}</span> : label === "Entregas" && nextDeliveries.length > 0 ? <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold">{nextDeliveries.length}</span> : null}</button>)}</nav>
        <div className="border-t border-white/8 p-4"><Link href="/" className="flex items-center gap-3 rounded-md p-3 text-sm text-white/60 hover:bg-white/5"><Store size={18} /><span>Ver site da loja</span><ArrowUpRight size={14} className="ml-auto" /></Link><div className="mt-2 flex items-center gap-3 rounded-md bg-white/5 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ed1c24] text-xs font-bold">SJ</span><div><p className="text-xs font-semibold">Admin São José</p><p className="text-[10px] text-white/40">Administrador</p></div><ChevronDown size={14} className="ml-auto text-white/40" /></div></div>
      </aside>

      <header className="sticky top-0 z-20 flex h-17 items-center justify-between border-b border-black/8 bg-[#f1f5f8]/95 px-4 backdrop-blur md:px-7 lg:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileMenuOpen(true)} className="grid h-10 w-10 place-items-center lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button><div><p className="text-[10px] text-[#76756e] lg:hidden">Casa São José ERP</p><h1 className="font-display text-xl md:text-2xl">{viewTitles[view]}</h1></div></div><div className="flex items-center gap-2 md:gap-3"><label className="hidden h-10 w-56 items-center gap-2 rounded-full border border-black/10 bg-white px-4 xl:flex"><Search size={15} className="text-[#89877e]" /><input className="w-full bg-transparent text-xs outline-none" placeholder="Buscar no sistema..." /></label><button className="relative grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white" aria-label="Notificações"><Bell size={17} /><span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-[#ed1c24]" /></button><button onClick={() => { navigate("pdv"); setPdvTab("nova"); }} className="flex h-10 items-center gap-2 rounded-md bg-[#ed1c24] px-3 text-xs font-bold text-white md:px-4"><Plus size={16} /><span className="hidden sm:inline">NOVA VENDA</span></button></div></header>

      <main className="px-4 pt-6 pb-28 md:px-7 md:pt-8 lg:px-10 lg:pb-12">
        <div className="mx-auto max-w-[1440px]">
          {view === "overview" ? (<>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs text-[#77756e]">Operação demonstrativa integrada</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Bom dia, Ana.</h2><p className="mt-1 text-sm text-[#77756e]">Aqui está o resumo atualizado da sua loja.</p></div><div className="flex gap-2"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-md border border-black/10 bg-white px-3 text-xs font-semibold outline-none"><option>Este mês</option><option>Últimos 7 dias</option><option>Hoje</option></select><button onClick={resetSimulation} title="Restaurar todos os dados da demonstração" className="grid h-10 w-10 place-items-center rounded-md border border-black/10 bg-white text-[#77756e]"><RotateCcw size={15} /></button></div></div>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              ["Vendas registradas", formatCurrency(salesTotal), `${validSales.length + orders.length} operações`, ArrowUpRight, "bg-[#e6eee5] text-[#526750]"],
              ["Saldo realizado", formatCurrency(received - paid), `${formatCurrency(received)} recebido`, CircleDollarSign, "bg-[#e6eee5] text-[#526750]"],
              ["A receber", formatCurrency(receivable), "lançamentos em aberto", Receipt, "bg-[#fff4d0] text-[#87630b]"],
              ["Ticket médio", formatCurrency(ticketAverage), "vendas e pedidos", WalletCards, "bg-[#e5edf7] text-[#315c88]"],
            ].map(([label, value, hint, Icon, badge]) => { const CardIcon = Icon as typeof ArrowUpRight; return <article key={label as string} className="min-w-0 rounded-lg border border-black/7 bg-white p-4 md:p-5"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e] md:text-xs">{label as string}</p><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${badge as string}`}><CardIcon size={14} /></span></div><strong className="mt-4 block truncate font-display text-2xl font-normal md:text-3xl">{value as string}</strong><p className="mt-2 text-[10px] text-[#8b8981]">{hint as string}</p></article>; })}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
            <article className="rounded-lg border border-black/7 bg-white p-5 md:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[#77756e]">Desempenho demonstrativo</p><p className="font-display mt-1 text-2xl">{formatCurrency(salesTotal)} <span className="font-sans text-[10px] font-bold text-[#5b7559]">dados integrados</span></p></div><div className="flex gap-4 text-[10px] text-[#77756e]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ed1c24]" /> Vendas</span></div></div><div className="mt-7 flex h-48 items-end gap-1.5 border-b border-[#ebe8e0] md:gap-3">{chartData.map((value, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t-sm bg-[#ed1c24]/85 transition-all hover:bg-[#bd1017]" style={{ height: `${(value / 126) * 100}%` }} /><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[9px] group-hover:block">{value}k</span></div>)}</div><div className="mt-3 flex justify-between text-[9px] text-[#99968e]"><span>INÍCIO</span><span>PERÍODO SELECIONADO: {period.toUpperCase()}</span></div></article>
            <article className="rounded-lg border border-black/7 bg-[#073f8c] p-5 text-white md:p-6"><div className="flex justify-between"><div><p className="text-xs text-white/50">Meta demonstrativa</p><p className="font-display mt-1 text-3xl">{goalProgress}%</p></div><CircleDollarSign className="text-[#ffd400]" /></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ffd400]" style={{ width: `${goalProgress}%` }} /></div><div className="mt-3 flex justify-between text-[10px] text-white/40"><span>{formatCurrency(salesTotal)} realizado</span><span>{formatCurrency(monthlyGoal)}</span></div><div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-[10px] text-white/40">Faltam</p><p className="font-display mt-1 text-xl">{formatCurrency(Math.max(0, monthlyGoal - salesTotal))}</p></div><div><p className="text-[10px] text-white/40">Lançamentos</p><p className="font-display mt-1 text-xl">{financialEntries.length}</p></div></div><p className="mt-6 rounded-md bg-white/5 px-3 py-2.5 text-[10px] leading-4 text-white/55">Os indicadores mudam conforme vendas, compras e baixas realizadas na demonstração.</p></article>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <article className="overflow-hidden rounded-lg border border-black/7 bg-white"><div className="flex items-center justify-between border-b border-black/7 p-5"><div><h3 className="font-display text-xl">Orçamentos recentes</h3><p className="mt-1 text-[10px] text-[#88867e]">Solicitações do site aparecem aqui automaticamente</p></div><button onClick={() => setView("quotes")} className="text-[10px] font-bold text-[#ed1c24]">VER TODOS</button></div><div className="divide-y divide-black/6">{quotes.slice(0, 4).map((quote) => <div key={quote.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0e8] text-xs font-bold text-[#ed1c24]">{quote.customer.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{quote.customer}</p><p className="mt-1 text-[10px] text-[#88867e]">{quote.id} · {quote.city} · {quote.total > 0 ? formatCurrency(quote.total) : "Sob consulta"}</p></div></div><div className="flex items-center justify-between gap-3 sm:justify-end">{storedQuotes.some((item) => item.id === quote.id) ? <select value={quote.status} onChange={(event) => updateStatus(quote.id, event.target.value as Quote["status"])} className="rounded-full border-0 bg-[#fff0e8] px-2 py-1 text-[10px] font-bold text-[#b83c1d] outline-none"><option>Novo</option><option>Em atendimento</option><option>Enviado</option><option>Aprovado</option></select> : <StatusBadge status={quote.status} />}<span className="text-[9px] text-[#99968e]">{new Date(quote.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span></div></div>)}</div></article>
            <article className="rounded-lg border border-black/7 bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-display text-xl">Atenção no estoque</h3><button onClick={() => setView("stock")} className="text-[10px] font-bold text-[#ed1c24]">VER ESTOQUE</button></div>{lowStock.length === 0 ? <div className="grid place-items-center py-8 text-center"><PackageCheck size={22} className="text-[#c8c5bd]" /><p className="mt-2 text-xs font-semibold">Estoque em nível saudável.</p></div> : <div className="mt-4 divide-y divide-black/6">{lowStock.slice(0, 5).map(({ product, quantity, min }) => <div key={product.id} className="flex items-center gap-3 py-3"><div className={`grid h-9 w-9 place-items-center rounded-md text-[10px] font-bold ${quantity === 0 ? "bg-[#f5e4e4] text-[#9a3b3b]" : quantity <= min * 0.5 ? "bg-[#fff0e8] text-[#b83c1d]" : "bg-[#fff4d0] text-[#87630b]"}`}>{quantity}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-0.5 text-[9px] text-[#99968e]">{product.category} · mínimo {min} {product.unit}</p></div><button onClick={() => { setView("stock"); setStockTab("movimentar"); }} className="text-[9px] font-bold text-[#ed1c24]">REPOR</button></div>)}</div>}</article>
          </section>

          <section className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white"><div className="flex items-center justify-between border-b border-black/7 p-5"><div><h3 className="font-display text-xl">Pedidos do site</h3><p className="mt-1 text-[10px] text-[#88867e]">Compras simuladas finalizadas no checkout aparecem aqui</p></div><span className="rounded-full bg-[#fff4d0] px-3 py-1 text-[10px] font-bold text-[#87630b]">{orders.length} PEDIDOS</span></div><div className="grid grid-cols-2 gap-px border-b border-black/7 bg-black/7 sm:grid-cols-4"><div className="bg-white p-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Total vendido pelo site</p><p className="font-display mt-1 text-2xl">{formatCurrency(onlineTotal)}</p></div><div className="bg-white p-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Pedidos</p><p className="font-display mt-1 text-2xl">{orders.length}</p></div><div className="bg-white p-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Retiradas</p><p className="font-display mt-1 text-2xl">{onlinePickups}</p></div><div className="bg-white p-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Entregas</p><p className="font-display mt-1 text-2xl">{onlineDeliveries}</p></div></div>{orders.length === 0 ? <div className="grid place-items-center px-5 py-10 text-center"><ShoppingBag size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhuma compra online finalizada.</p><p className="mt-1 text-[10px] text-[#88867e]">Faça uma compra no site para testar a integração.</p></div> : <div className="divide-y divide-black/6">{orders.slice(0, 5).map((order) => <div key={order.id} className="grid gap-3 p-4 sm:grid-cols-[.7fr_1.2fr_.8fr_.8fr_.8fr] sm:items-center"><div><p className="text-xs font-bold text-[#ed1c24]">{order.id}</p><p className="mt-1 text-[9px] text-[#99968e]">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{order.customer.name}</p><p className="mt-1 text-[9px] text-[#88867e]">{order.items.length} produto(s) · {order.customer.phone}</p></div><div><p className="text-[9px] text-[#99968e]">Recebimento</p><p className="mt-1 text-xs font-semibold">{order.fulfillment}</p></div><div><p className="text-[9px] text-[#99968e]">Pagamento</p><p className="mt-1 text-xs font-semibold">{order.payment.method}{order.payment.installments ? ` ${order.payment.installments}x` : ""}</p></div><div className="flex items-center justify-between gap-3 sm:block"><div><p className="text-[9px] text-[#99968e]">Total</p><p className="mt-1 text-xs font-bold">{formatCurrency(order.total)}</p></div><span className="rounded-full bg-[#fff4d0] px-2.5 py-1 text-[9px] font-bold text-[#87630b]">Separação</span></div></div>)}</div>}</section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
            <article className="overflow-hidden rounded-lg border border-black/7 bg-white"><div className="flex items-center justify-between border-b border-black/7 p-5"><h3 className="font-display text-xl">Últimas vendas</h3><button onClick={() => { setView("pdv"); setPdvTab("vendas"); }} className="text-[10px] font-bold text-[#ed1c24]">VER PDV</button></div><div className="hidden grid-cols-[.7fr_1.3fr_1fr_1fr_.8fr] gap-4 border-b border-black/6 px-5 py-3 text-[9px] font-bold tracking-wider text-[#99968e] uppercase sm:grid"><span>Venda</span><span>Cliente</span><span>Pagamento</span><span>Valor</span><span>Status</span></div>{sales.slice(0, 5).map((sale) => <div key={sale.id} className="grid grid-cols-2 gap-2 border-b border-black/6 px-5 py-4 text-xs last:border-0 sm:grid-cols-[.7fr_1.3fr_1fr_1fr_.8fr] sm:items-center sm:gap-4"><span className="font-semibold text-[#ed1c24]">{sale.id}</span><span className="truncate font-semibold">{sale.customer}</span><span className="text-[10px] text-[#77756e]">{sale.payment.method}{sale.payment.installments ? ` ${sale.payment.installments}x` : ""}</span><span className="text-right font-semibold sm:text-left">{formatCurrency(sale.total)}</span><span className="col-span-2 sm:col-span-1"><StatusBadge status={sale.status} /></span></div>)}</article>
            <article className="rounded-lg border border-black/7 bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-display text-xl">Próximas entregas</h3><button onClick={() => navigate("deliveries")} aria-label="Abrir entregas"><Truck size={18} className="text-[#ed1c24]" /></button></div>{nextDeliveries.length === 0 ? <div className="grid place-items-center py-10 text-center"><PackageCheck size={24} className="text-[#c8c5bd]" /><p className="mt-2 text-xs font-semibold">Nenhuma entrega pendente.</p></div> : <div className="mt-5 space-y-4">{nextDeliveries.map((delivery, index) => <button key={delivery.id} onClick={() => navigate("deliveries")} className="flex w-full gap-3 text-left"><div className="flex flex-col items-center"><span className={`h-2.5 w-2.5 rounded-full ${delivery.status === "Em rota" ? "bg-[#ed1c24]" : "bg-[#d2cec3]"}`} />{index < nextDeliveries.length - 1 && <span className="h-full w-px bg-[#e5e1d8]" />}</div><div className="pb-3"><p className="text-[10px] font-bold text-[#ed1c24]">{new Date(`${delivery.scheduledAt}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {delivery.window}</p><p className="mt-1 text-xs font-semibold">{delivery.customer}</p><p className="mt-1 text-[9px] text-[#88867e]">{delivery.status} · {delivery.assignee}</p></div></button>)}</div>}</article>
          </section>
          </>) : view === "pdv" ? (
            <PdvView tab={pdvTab} onTabChange={setPdvTab} />
          ) : view === "quotes" ? (
            <QuotesView tab={quotesTab} onTabChange={setQuotesTab} />
          ) : view === "stock" ? (
            <StockView tab={stockTab} onTabChange={setStockTab} />
          ) : view === "compras" ? (
            <PurchasesView tab={comprasTab} onTabChange={setComprasTab} />
          ) : view === "inventory" ? (
            <InventoryView />
          ) : view === "deliveries" ? (
            <DeliveriesView />
          ) : view === "finance" ? (
            <FinanceView />
          ) : (
            <RegistrationsView />
          )}
        </div>
      </main>

      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" role="dialog" aria-modal="true" aria-label="Navegação do ERP" onClick={() => setMobileMenuOpen(false)}><aside className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mx-auto mb-4 h-1 w-12 rounded-full bg-black/15" /><div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-bold tracking-wider text-[#ed1c24] uppercase">Navegação</p><h2 className="font-display text-2xl">Módulos do ERP</h2></div><button onClick={() => setMobileMenuOpen(false)} className="h-9 rounded-md border border-black/10 px-3 text-[10px] font-bold">FECHAR</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{navItems.map(({ icon: NavIcon, label, view: itemView }) => <button key={itemView} onClick={() => navigate(itemView)} className={`flex h-12 items-center gap-3 rounded-md px-3 text-left text-xs font-semibold ${view === itemView ? "bg-[#073f8c] text-white" : "bg-[#f1f5f8] text-[#55534c]"}`}><NavIcon size={17} />{label}</button>)}</div></aside></div>}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-black/10 bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,.06)] lg:hidden" aria-label="Navegação do ERP"><button onClick={() => navigate("overview")} className={`flex flex-col items-center gap-1 ${view === "overview" ? "text-[#ed1c24]" : "text-[#88867e]"}`}><House size={19} /><span className={`text-[9px] ${view === "overview" ? "font-bold" : ""}`}>Início</span></button><button onClick={() => navigate("pdv")} className={`flex flex-col items-center gap-1 ${view === "pdv" ? "text-[#ed1c24]" : "text-[#88867e]"}`}><ShoppingBag size={19} /><span className={`text-[9px] ${view === "pdv" ? "font-bold" : ""}`}>Vendas</span></button><button onClick={() => navigate("quotes")} className={`flex flex-col items-center gap-1 ${view === "quotes" ? "text-[#ed1c24]" : "text-[#88867e]"}`}><FileText size={19} /><span className={`text-[9px] ${view === "quotes" ? "font-bold" : ""}`}>Orçamentos</span></button><button onClick={() => navigate("stock")} className={`flex flex-col items-center gap-1 ${view === "stock" ? "text-[#ed1c24]" : "text-[#88867e]"}`}><Boxes size={19} /><span className={`text-[9px] ${view === "stock" ? "font-bold" : ""}`}>Estoque</span></button><button onClick={() => setMobileMenuOpen(true)} className={`flex flex-col items-center gap-1 ${!["overview", "pdv", "quotes", "stock"].includes(view) ? "text-[#ed1c24]" : "text-[#88867e]"}`}><Menu size={19} /><span className="text-[9px]">Mais</span></button></nav>
    </div>
  );
}
