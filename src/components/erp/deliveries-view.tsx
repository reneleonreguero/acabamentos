"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { formatCurrency } from "@/data/products";
import { DELIVERIES_KEY, Delivery, DeliveryStatus, demoDeliveries } from "@/lib/deliveries";
import { demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct } from "@/lib/registrations";
import { createId, Order, ORDERS_KEY, readStorage, Sale, SALES_KEY, writeStorage } from "@/lib/storage";
import { useStorageCollection } from "@/lib/use-storage-collection";

const statuses: DeliveryStatus[] = ["A separar", "Agendada", "Em rota", "Entregue", "Ocorrência", "Cancelada"];
const deliveryFlow: DeliveryStatus[] = ["A separar", "Agendada", "Em rota", "Entregue"];

const statusStyles: Record<DeliveryStatus, string> = {
  "A separar": "bg-[#fff4d0] text-[#87630b]",
  "Agendada": "bg-[#e5edf7] text-[#315c88]",
  "Em rota": "bg-[#fff0e8] text-[#b83c1d]",
  "Entregue": "bg-[#dce8dc] text-[#4f684f]",
  "Ocorrência": "bg-[#f5e4e4] text-[#9a3b3b]",
  "Cancelada": "bg-[#eeeeeb] text-[#77756e]",
};

type DeliveryItem = Delivery["items"][number];

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string, long = false) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", long
    ? { day: "2-digit", month: "long", year: "numeric" }
    : { day: "2-digit", month: "short" });
}

function productOf(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId);
}

function productName(products: RegisteredProduct[], productId: number) {
  return productOf(products, productId)?.name ?? `Produto ${productId}`;
}

function deliveryTotal(products: RegisteredProduct[], items: DeliveryItem[]) {
  return items.reduce((sum, item) => sum + (productOf(products, item.productId)?.price ?? 0) * item.quantity, 0);
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>{status}</span>;
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="grid place-items-center px-5 py-14 text-center">
      <Truck size={30} className="text-[#c8c5bd]" />
      <p className="mt-3 text-sm font-semibold">{filtered ? "Nenhuma entrega encontrada." : "Nenhuma entrega cadastrada."}</p>
      <p className="mt-1 text-[10px] text-[#88867e]">{filtered ? "Altere os filtros para consultar outros agendamentos." : "Cadastre uma entrega manual para começar a agenda."}</p>
    </div>
  );
}

function NewDeliveryForm({ deliveries, products, onCancel, onSaved }: { deliveries: Delivery[]; products: RegisteredProduct[]; onCancel: () => void; onSaved: (id: string) => void }) {
  const activeProducts = products.filter((product) => product.active);
  const [form, setForm] = useState({ customer: "", phone: "", address: "", scheduledAt: localDate(), window: "Comercial" as Delivery["window"], assignee: "", notes: "" });
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [productId, setProductId] = useState(activeProducts[0]?.id ?? 0);
  const [quantity, setQuantity] = useState("1");

  const total = deliveryTotal(products, items);

  function addItem() {
    const parsed = Math.floor(Number(quantity));
    if (!activeProducts.some((product) => product.id === productId) || parsed <= 0) return;
    setItems((current) => current.some((item) => item.productId === productId)
      ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + parsed } : item)
      : [...current, { productId, quantity: parsed }]);
    setQuantity("1");
  }

  function updateQuantity(id: number, next: number) {
    setItems((current) => next <= 0
      ? current.filter((item) => item.productId !== id)
      : current.map((item) => item.productId === id ? { ...item, quantity: next } : item));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.customer.trim() || !form.phone.trim() || !form.address.trim() || !form.scheduledAt || !form.assignee.trim() || items.length === 0) return;
    const id = createId("ENT");
    const delivery: Delivery = {
      id,
      sourceType: "Manual",
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      scheduledAt: form.scheduledAt,
      window: form.window,
      assignee: form.assignee.trim(),
      status: "A separar",
      notes: form.notes.trim(),
      items,
      total,
      createdAt: new Date().toISOString(),
    };
    writeStorage(DELIVERIES_KEY, [delivery, ...deliveries]);
    onSaved(id);
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-4 xl:grid-cols-[1fr_.72fr]">
      <section className="rounded-lg border border-black/7 bg-white p-5">
        <div><h3 className="font-display text-xl">Nova entrega manual</h3><p className="mt-1 text-[10px] text-[#88867e]">Informe o destino, a agenda e os produtos que serão enviados</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#77756e] uppercase">Cliente *<input required value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Nome ou razão social" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Telefone *<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="(11) 00000-0000" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase sm:col-span-2">Endereço completo *<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Rua, número, bairro e cidade" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Data *<input required type="date" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase">Janela *<select value={form.window} onChange={(event) => setForm({ ...form, window: event.target.value as Delivery["window"] })} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-[#073f8c]"><option>Manhã</option><option>Tarde</option><option>Comercial</option></select></label>
          <label className="text-xs font-bold text-[#77756e] uppercase sm:col-span-2">Responsável *<input required value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Motorista ou equipe" /></label>
          <label className="text-xs font-bold text-[#77756e] uppercase sm:col-span-2">Observação<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-2 w-full resize-none rounded-md border border-black/10 px-3 py-2 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Referência, instruções de descarga ou contato prévio" /></label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="border-b border-black/7 p-5"><h3 className="font-display text-xl">Itens da entrega</h3><p className="mt-1 text-[10px] text-[#88867e]">É necessário adicionar ao menos um produto</p></div>
        <div className="bg-[#f7f8fa] p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_90px_auto]">
            <label className="text-[10px] font-bold text-[#77756e] uppercase">Produto<select disabled={activeProducts.length === 0} value={productId} onChange={(event) => setProductId(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-black/10 bg-white px-2 text-xs font-medium outline-none focus:border-[#073f8c] disabled:opacity-50">{activeProducts.length === 0 ? <option value={0}>Nenhum produto ativo</option> : activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="text-[10px] font-bold text-[#77756e] uppercase">Quantidade<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))} className="mt-1.5 h-10 w-full rounded-md border border-black/10 px-2 text-xs font-semibold outline-none focus:border-[#073f8c]" /></label>
            <button type="button" disabled={activeProducts.length === 0} onClick={addItem} className="flex h-10 items-center justify-center gap-1.5 self-end rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white enabled:hover:bg-[#ed1c24] disabled:opacity-40"><Plus size={14} /> ADD</button>
          </div>
        </div>
        <div className="divide-y divide-black/6 px-5">
          {items.length === 0 ? <p className="py-7 text-center text-xs text-[#88867e]">Nenhum produto adicionado.</p> : items.map((item) => {
            const product = productOf(products, item.productId);
            return <div key={item.productId} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{productName(products, item.productId)}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{product?.price !== undefined ? `${formatCurrency(product.price)} / ${product.unit}` : "Preço sob consulta"}</p></div><div className="flex h-9 items-center rounded-md border border-black/10"><button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="grid h-full w-8 place-items-center text-[#77756e]" aria-label="Diminuir quantidade"><Minus size={13} /></button><span className="min-w-8 text-center text-xs font-bold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="grid h-full w-8 place-items-center text-[#77756e]" aria-label="Aumentar quantidade"><Plus size={13} /></button></div><button type="button" onClick={() => updateQuantity(item.productId, 0)} className="grid h-8 w-8 place-items-center text-[#b0ada5] hover:text-[#b83c1d]" aria-label="Remover produto"><Trash2 size={14} /></button></div>;
          })}
        </div>
        <div className="border-t border-black/7 p-5">
          <div className="flex items-end justify-between"><span className="text-xs font-semibold text-[#77756e]">Total dos itens</span><strong className="font-display text-2xl font-normal">{formatCurrency(total)}</strong></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onCancel} className="h-12 rounded-md border border-black/10 text-xs font-bold text-[#77756e]">CANCELAR</button><button disabled={items.length === 0} className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-xs font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><Truck size={16} /> SALVAR ENTREGA</button></div>
        </div>
      </section>
    </form>
  );
}

export function DeliveriesView() {
  const deliveries = useStorageCollection<Delivery>(DELIVERIES_KEY, demoDeliveries);
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Todos" | DeliveryStatus>("Todos");
  const [date, setDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const today = localDate();

  const sorted = [...deliveries].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.window.localeCompare(b.window));
  const filtered = sorted.filter((delivery) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term || [delivery.id, delivery.customer, delivery.phone, delivery.address, delivery.assignee, delivery.sourceId ?? ""].some((value) => value.toLowerCase().includes(term));
    return matchesTerm && (status === "Todos" || delivery.status === status) && (!date || delivery.scheduledAt === date);
  });
  const selected = deliveries.find((delivery) => delivery.id === selectedId) ?? null;
  const stats = [
    { label: "Entregas hoje", value: deliveries.filter((item) => item.scheduledAt === today).length, hint: "agenda do dia", Icon: CalendarDays, tone: "bg-[#e5edf7] text-[#315c88]" },
    { label: "A separar", value: deliveries.filter((item) => item.status === "A separar").length, hint: "aguardando preparação", Icon: PackageCheck, tone: "bg-[#fff4d0] text-[#87630b]" },
    { label: "Em rota", value: deliveries.filter((item) => item.status === "Em rota").length, hint: "a caminho do cliente", Icon: Truck, tone: "bg-[#fff0e8] text-[#b83c1d]" },
    { label: "Concluídas", value: deliveries.filter((item) => item.status === "Entregue").length, hint: "entregas finalizadas", Icon: CheckCircle2, tone: "bg-[#dce8dc] text-[#4f684f]" },
    { label: "Ocorrências", value: deliveries.filter((item) => item.status === "Ocorrência").length, hint: "exigem atenção", Icon: AlertTriangle, tone: "bg-[#f5e4e4] text-[#9a3b3b]" },
  ];

  function updateStatus(id: string, next: DeliveryStatus) {
    const delivery = deliveries.find((item) => item.id === id);
    if (!delivery || delivery.status === "Cancelada") return;
    writeStorage(DELIVERIES_KEY, deliveries.map((item) => item.id === id ? { ...item, status: next } : item));

    if (delivery.sourceType === "Venda" && delivery.sourceId) {
      const sales = readStorage<Sale[]>(SALES_KEY, []);
      const saleStatus: Sale["status"] = next === "Entregue" ? "Concluída" : next === "A separar" || next === "Agendada" ? "Separação" : "Entrega";
      writeStorage(SALES_KEY, sales.map((sale) => sale.id === delivery.sourceId ? { ...sale, status: saleStatus } : sale));
    }
    if (delivery.sourceType === "Pedido" && delivery.sourceId) {
      const orders = readStorage<Order[]>(ORDERS_KEY, []);
      const orderStatus: Order["orderStatus"] = next === "A separar" ? "Aguardando separação" : next === "Agendada" ? "Agendado" : next === "Em rota" ? "Em rota" : next === "Entregue" ? "Entregue" : "Ocorrência";
      writeStorage(ORDERS_KEY, orders.map((order) => order.id === delivery.sourceId ? { ...order, orderStatus } : order));
    }
  }

  function openSaved(id: string) {
    setCreating(false);
    setSearch("");
    setStatus("Todos");
    setDate("");
    setSelectedId(id);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs text-[#77756e]">Logística</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Entregas</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Organize a separação, a agenda e o acompanhamento das rotas.</p></div>
        <button onClick={() => setCreating((current) => !current)} className={`flex h-11 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold ${creating ? "border border-black/10 bg-white text-[#77756e]" : "bg-[#ed1c24] text-white hover:bg-[#bd1017]"}`}>{creating ? "VOLTAR À AGENDA" : <><Plus size={16} /> NOVA ENTREGA</>}</button>
      </div>

      {creating ? <NewDeliveryForm deliveries={deliveries} products={products} onCancel={() => setCreating(false)} onSaved={openSaved} /> : <>
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {stats.map(({ label, value, hint, Icon, tone }) => <article key={label} className="rounded-lg border border-black/7 bg-white p-4"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label}</p><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${tone}`}><Icon size={14} /></span></div><strong className="font-display mt-3 block text-2xl font-normal">{value}</strong><p className="mt-1 text-[9px] text-[#99968e]">{hint}</p></article>)}
        </section>

        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <section className="overflow-hidden rounded-lg border border-black/7 bg-white">
            <div className="border-b border-black/7 p-5">
              <div><h3 className="font-display text-xl">Agenda de entregas</h3><p className="mt-1 text-[10px] text-[#88867e]">{filtered.length} entrega(s) na consulta</p></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px_145px]">
                <label className="flex h-10 items-center gap-2 rounded-md border border-black/10 px-3"><Search size={15} className="shrink-0 text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Cliente, endereço, código..." /></label>
                <select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value as "Todos" | DeliveryStatus)} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none"><option>Todos</option>{statuses.map((option) => <option key={option}>{option}</option>)}</select>
                <input aria-label="Filtrar por data" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none" />
              </div>
            </div>
            {filtered.length === 0 ? <EmptyState filtered={Boolean(search || status !== "Todos" || date)} /> : <div className="divide-y divide-black/6">{filtered.map((delivery) => (
              <button key={delivery.id} onClick={() => setSelectedId(delivery.id)} className={`grid w-full gap-3 p-4 text-left transition-colors sm:grid-cols-[115px_1fr_auto] sm:items-center ${selectedId === delivery.id ? "bg-[#eef3fa]" : "hover:bg-[#f7f8fa]"}`}>
                <div><p className="text-[10px] font-bold text-[#ed1c24]">{formatDate(delivery.scheduledAt)}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#77756e]"><Clock3 size={12} /> {delivery.window}</p></div>
                <div className="min-w-0"><p className="truncate text-xs font-semibold">{delivery.customer}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{delivery.id} · {delivery.address}</p><p className="mt-1 text-[9px] text-[#99968e]">{delivery.assignee} · {delivery.items.length} item(ns)</p></div>
                <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge status={delivery.status} /><ChevronRight size={15} className="text-[#aaa79e]" /></div>
              </button>
            ))}</div>}
          </section>

          {selected ? <aside className="rounded-lg border border-black/7 bg-white p-5 xl:sticky xl:top-24">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-[#ed1c24]">{selected.id}</p><h3 className="font-display mt-1 text-2xl leading-tight">{selected.customer}</h3><p className="mt-1 text-[10px] text-[#99968e]">{formatDate(selected.scheduledAt, true)} · {selected.window}</p></div><StatusBadge status={selected.status} /></div>
            <div className="mt-4 space-y-2 border-y border-black/7 py-4 text-xs text-[#77756e]"><p className="flex items-start gap-2"><PackageCheck size={14} className="mt-0.5 shrink-0" /><span>Origem: <strong className="text-[#282824]">{selected.sourceType}{selected.sourceId ? ` ${selected.sourceId}` : ""}</strong></span></p><p className="flex items-start gap-2"><Phone size={14} className="mt-0.5 shrink-0" /> {selected.phone}</p><p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> {selected.address}</p><p className="flex items-start gap-2"><UserRound size={14} className="mt-0.5 shrink-0" /> Responsável: {selected.assignee}</p></div>
            <div className="mt-4"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Itens</p><div className="mt-2 divide-y divide-black/6">{selected.items.map((item) => <div key={item.productId} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{productName(products, item.productId)}</p><p className="mt-0.5 text-[9px] text-[#88867e]">{item.quantity} {productOf(products, item.productId)?.unit ?? "un."}</p></div><span className="text-xs font-bold">{formatCurrency((productOf(products, item.productId)?.price ?? 0) * item.quantity)}</span></div>)}</div></div>
            <div className="flex items-end justify-between border-t border-black/7 pt-4"><span className="text-xs font-semibold text-[#77756e]">Total</span><strong className="font-display text-2xl font-normal">{formatCurrency(selected.total)}</strong></div>
            <div className="mt-4 rounded-md bg-[#f7f8fa] p-3"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Observações</p><p className="mt-1 text-[11px] leading-5 text-[#77756e]">{selected.notes || "Nenhuma observação registrada."}</p></div>
            {selected.status === "Cancelada" ? <p className="mt-5 rounded-md bg-[#eeeeeb] p-3 text-center text-[10px] font-semibold text-[#77756e]">Entrega cancelada na origem. O histórico foi preservado.</p> : <div className="mt-5"><p className="text-[9px] font-bold tracking-wider text-[#99968e] uppercase">Atualizar andamento</p><div className="mt-2 grid grid-cols-2 gap-2">{deliveryFlow.map((option) => <button key={option} onClick={() => updateStatus(selected.id, option)} className={`h-9 rounded-md text-[10px] font-bold ${selected.status === option ? statusStyles[option] : "border border-black/10 text-[#77756e] hover:border-[#073f8c]"}`}>{option.toUpperCase()}</button>)}</div><button onClick={() => updateStatus(selected.id, "Ocorrência")} className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md text-[10px] font-bold ${selected.status === "Ocorrência" ? statusStyles["Ocorrência"] : "border border-[#d8bcbc] text-[#9a3b3b] hover:bg-[#f5e4e4]"}`}><AlertTriangle size={14} /> MARCAR OCORRÊNCIA</button></div>}
          </aside> : <aside className="grid min-h-[260px] place-items-center rounded-lg border border-dashed border-black/10 bg-white p-8 text-center"><div><Truck size={28} className="mx-auto text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Selecione uma entrega</p><p className="mt-1 max-w-56 text-[10px] text-[#88867e]">Abra um agendamento para consultar os dados e atualizar o andamento.</p></div></aside>}
        </div>
      </>}
    </div>
  );
}
