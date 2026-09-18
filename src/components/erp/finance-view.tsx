"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Plus,
  RotateCcw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { formatCurrency } from "@/data/products";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry, FinancialStatus } from "@/lib/finance";
import { createId, writeStorage } from "@/lib/storage";
import { useStorageCollection } from "@/lib/use-storage-collection";

type KindFilter = "Todos" | FinancialEntry["kind"];
type StatusFilter = "Todos" | FinancialStatus;
type PeriodFilter = "Todos" | "Este mês" | "Próximos 30 dias" | "Vencidos";

const statusStyles: Record<FinancialStatus, string> = {
  Pago: "bg-[#dce8dc] text-[#4f684f]",
  Pendente: "bg-[#fff4d0] text-[#87630b]",
  Vencido: "bg-[#f5e4e4] text-[#9a3b3b]",
  Cancelado: "bg-[#eeeeeb] text-[#77756e]",
};

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function effectiveStatus(entry: FinancialEntry, today: string): FinancialStatus {
  if (entry.status === "Pago" || entry.status === "Cancelado") return entry.status;
  return entry.dueAt < today ? "Vencido" : "Pendente";
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function StatusBadge({ status }: { status: FinancialStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>{status}</span>;
}

export function FinanceView() {
  const entries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const [kind, setKind] = useState<KindFilter>("Todos");
  const [status, setStatus] = useState<StatusFilter>("Todos");
  const [period, setPeriod] = useState<PeriodFilter>("Todos");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formKind, setFormKind] = useState<FinancialEntry["kind"]>("Receber");
  const [description, setDescription] = useState("");
  const [party, setParty] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [message, setMessage] = useState("");
  const today = localDateKey();

  const totals = useMemo(() => {
    const valid = entries.filter((entry) => entry.status !== "Cancelado");
    const paid = valid.filter((entry) => effectiveStatus(entry, today) === "Pago");
    const open = valid.filter((entry) => ["Pendente", "Vencido"].includes(effectiveStatus(entry, today)));
    const received = paid.filter((entry) => entry.kind === "Receber").reduce((sum, entry) => sum + entry.amount, 0);
    const paidOut = paid.filter((entry) => entry.kind === "Pagar").reduce((sum, entry) => sum + entry.amount, 0);
    const receivable = open.filter((entry) => entry.kind === "Receber").reduce((sum, entry) => sum + entry.amount, 0);
    const payable = open.filter((entry) => entry.kind === "Pagar").reduce((sum, entry) => sum + entry.amount, 0);
    const overdue = open.filter((entry) => effectiveStatus(entry, today) === "Vencido").reduce((sum, entry) => sum + entry.amount, 0);
    return { balance: received - paidOut, received, paidOut, receivable, payable, overdue };
  }, [entries, today]);

  const filtered = useMemo(() => {
    const inThirtyDays = new Date(`${today}T12:00:00`);
    inThirtyDays.setDate(inThirtyDays.getDate() + 30);
    const end = localDateKey(inThirtyDays);
    const month = today.slice(0, 7);
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return entries
      .filter((entry) => {
        const entryStatus = effectiveStatus(entry, today);
        const matchesSearch = !term || [entry.description, entry.party, entry.category, entry.id].some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
        const matchesPeriod = period === "Todos"
          || (period === "Este mês" && entry.dueAt.startsWith(month))
          || (period === "Próximos 30 dias" && entry.dueAt >= today && entry.dueAt <= end)
          || (period === "Vencidos" && entryStatus === "Vencido");
        return matchesSearch && matchesPeriod && (kind === "Todos" || entry.kind === kind) && (status === "Todos" || entryStatus === status);
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || b.createdAt.localeCompare(a.createdAt));
  }, [entries, kind, period, search, status, today]);

  const categoryFlow = useMemo(() => {
    const grouped = new Map<string, { incoming: number; outgoing: number }>();
    entries.filter((entry) => entry.status !== "Cancelado").forEach((entry) => {
      const current = grouped.get(entry.category) ?? { incoming: 0, outgoing: 0 };
      if (entry.kind === "Receber") current.incoming += entry.amount;
      else current.outgoing += entry.amount;
      grouped.set(entry.category, current);
    });
    return [...grouped.entries()]
      .map(([name, values]) => ({ name, ...values, total: values.incoming + values.outgoing }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [entries]);
  const maxCategoryValue = Math.max(1, ...categoryFlow.flatMap((item) => [item.incoming, item.outgoing]));

  const cards = [
    { label: "Saldo realizado", value: totals.balance, hint: "recebido menos pago", Icon: CircleDollarSign, tone: totals.balance >= 0 ? "bg-[#dce8dc] text-[#4f684f]" : "bg-[#f5e4e4] text-[#9a3b3b]" },
    { label: "Recebido", value: totals.received, hint: "entradas pagas", Icon: ArrowDownLeft, tone: "bg-[#dce8dc] text-[#4f684f]" },
    { label: "Pago", value: totals.paidOut, hint: "saídas pagas", Icon: ArrowUpRight, tone: "bg-[#e5edf7] text-[#315c88]" },
    { label: "A receber", value: totals.receivable, hint: "pendente e vencido", Icon: WalletCards, tone: "bg-[#fff4d0] text-[#87630b]" },
    { label: "A pagar", value: totals.payable, hint: "pendente e vencido", Icon: CalendarDays, tone: "bg-[#fff0e8] text-[#b83c1d]" },
    { label: "Vencido", value: totals.overdue, hint: "receber e pagar", Icon: Clock3, tone: "bg-[#f5e4e4] text-[#9a3b3b]" },
  ];

  function updateEntry(id: string, next: "pay" | "reopen") {
    const updated = entries.map((entry): FinancialEntry => entry.id === id
      ? next === "pay"
        ? { ...entry, status: "Pago", paidAt: today }
        : { ...entry, status: "Pendente", paidAt: undefined }
      : entry);
    writeStorage(FINANCIAL_KEY, updated);
    setMessage(next === "pay" ? "Lançamento marcado como pago." : "Lançamento reaberto.");
  }

  function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (!description.trim() || !party.trim() || !category.trim() || !dueAt || numericAmount <= 0) return;

    const entry: FinancialEntry = {
      id: createId("FIN"),
      kind: formKind,
      description: description.trim(),
      party: party.trim(),
      category: category.trim(),
      amount: numericAmount,
      dueAt,
      status: dueAt < today ? "Vencido" : "Pendente",
      sourceType: "Manual",
      createdAt: new Date().toISOString(),
    };
    writeStorage(FINANCIAL_KEY, [entry, ...entries]);
    setDescription("");
    setParty("");
    setCategory("");
    setAmount("");
    setDueAt("");
    setShowForm(false);
    setMessage("Lançamento manual criado.");
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, hint, Icon, tone }) => (
          <article key={label} className="min-w-0 rounded-lg border border-black/7 bg-white p-4">
            <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label}</p><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${tone}`}><Icon size={14} /></span></div>
            <strong className="font-display mt-3 block truncate text-xl font-normal 2xl:text-2xl">{formatCurrency(value)}</strong>
            <p className="mt-1 text-[9px] text-[#99968e]">{hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-lg border border-black/7 bg-white" aria-labelledby="financial-entries-title">
          <div className="border-b border-black/7 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 id="financial-entries-title" className="font-display text-xl">Fluxo financeiro</h2><p className="mt-1 text-[10px] text-[#88867e]">Contas a receber, pagamentos e lançamentos manuais</p></div>
              <button type="button" onClick={() => setShowForm((current) => !current)} aria-expanded={showForm} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ed1c24] px-4 text-xs font-bold text-white hover:bg-[#bd1017]"><Plus size={15} /> NOVO LANÇAMENTO</button>
            </div>

            <div className="mt-4 flex gap-1 overflow-x-auto rounded-md bg-[#f1f5f8] p-1" role="tablist" aria-label="Tipo de lançamento">
              {(["Todos", "Receber", "Pagar"] as const).map((option) => <button key={option} type="button" role="tab" aria-selected={kind === option} onClick={() => setKind(option)} className={`min-w-fit flex-1 rounded px-3 py-2 text-[10px] font-bold ${kind === option ? "bg-white text-[#073f8c] shadow-sm" : "text-[#77756e] hover:text-[#282824]"}`}>{option === "Todos" ? "FLUXO / TODOS" : option === "Receber" ? "A RECEBER" : "A PAGAR"}</button>)}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="flex h-10 items-center gap-2 rounded-md border border-black/10 px-3"><span className="sr-only">Buscar lançamentos</span><Search size={15} className="shrink-0 text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar descrição, pessoa ou categoria..." /></label>
              <label><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#073f8c]"><option>Todos</option><option>Pendente</option><option>Pago</option><option>Vencido</option><option>Cancelado</option></select></label>
              <label><span className="sr-only">Filtrar por período</span><select value={period} onChange={(event) => setPeriod(event.target.value as PeriodFilter)} className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#073f8c]"><option>Todos</option><option>Este mês</option><option>Próximos 30 dias</option><option>Vencidos</option></select></label>
            </div>
          </div>

          {showForm && (
            <form onSubmit={createEntry} className="border-b border-black/7 bg-[#f7f8fa] p-5" aria-label="Novo lançamento manual">
              <div className="flex items-center justify-between"><div><h3 className="font-display text-lg">Novo lançamento manual</h3><p className="mt-1 text-[10px] text-[#88867e]">Preencha os dados da conta e o vencimento</p></div><button type="button" onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-[#77756e]" aria-label="Fechar formulário"><X size={15} /></button></div>
              <fieldset className="mt-4"><legend className="text-[10px] font-bold text-[#77756e] uppercase">Tipo</legend><div className="mt-2 grid max-w-xs grid-cols-2 gap-2">{(["Receber", "Pagar"] as const).map((option) => <button key={option} type="button" onClick={() => setFormKind(option)} className={`h-10 rounded-md border text-xs font-bold ${formKind === option ? "border-[#073f8c] bg-[#e5edf7] text-[#073f8c]" : "border-black/10 bg-white text-[#77756e]"}`}>{option === "Receber" ? "RECEBER" : "PAGAR"}</button>)}</div></fieldset>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-[10px] font-bold text-[#77756e] uppercase sm:col-span-2">Descrição *<input required value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" /></label>
                <label className="text-[10px] font-bold text-[#77756e] uppercase">Pessoa / empresa *<input required value={party} onChange={(event) => setParty(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" /></label>
                <label className="text-[10px] font-bold text-[#77756e] uppercase">Categoria *<input required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" placeholder="Ex.: Despesas fixas" /></label>
                <label className="text-[10px] font-bold text-[#77756e] uppercase">Valor *<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" placeholder="0,00" /></label>
                <label className="text-[10px] font-bold text-[#77756e] uppercase">Vencimento *<input required type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" /></label>
              </div>
              <div className="mt-5 flex justify-end"><button type="submit" className="flex h-10 items-center gap-2 rounded-md bg-[#073f8c] px-5 text-xs font-bold text-white hover:bg-[#ed1c24]"><CheckCircle2 size={15} /> SALVAR LANÇAMENTO</button></div>
            </form>
          )}

          <p className="sr-only" role="status" aria-live="polite">{message}</p>
          <div className="hidden grid-cols-[.7fr_1.5fr_1fr_.8fr_.8fr_auto] gap-4 border-b border-black/6 px-5 py-3 text-[9px] font-bold tracking-wider text-[#99968e] uppercase lg:grid"><span>Vencimento</span><span>Lançamento</span><span>Categoria</span><span>Status</span><span>Valor</span><span>Ação</span></div>
          {filtered.length === 0 ? (
            <div className="grid place-items-center px-5 py-14 text-center"><WalletCards size={30} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum lançamento encontrado.</p><p className="mt-1 text-[10px] text-[#88867e]">Ajuste os filtros ou crie um lançamento manual.</p></div>
          ) : (
            <div className="divide-y divide-black/6">
              {filtered.map((entry) => {
                const entryStatus = effectiveStatus(entry, today);
                return (
                  <article key={entry.id} className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-xs lg:grid-cols-[.7fr_1.5fr_1fr_.8fr_.8fr_auto] lg:items-center">
                    <div><p className={`font-semibold ${entryStatus === "Vencido" ? "text-[#9a3b3b]" : "text-[#77756e]"}`}>{formatDate(entry.dueAt)}</p><p className="mt-1 text-[9px] text-[#99968e]">{entry.id}</p></div>
                    <div className="min-w-0"><p className="truncate font-semibold">{entry.description}</p><p className="mt-1 truncate text-[9px] text-[#88867e]">{entry.party} · {entry.sourceType}{entry.sourceId ? ` ${entry.sourceId}` : ""}</p></div>
                    <p className="truncate text-[10px] text-[#77756e]">{entry.category}</p>
                    <div><StatusBadge status={entryStatus} />{entry.paidAt && <p className="mt-1 text-[9px] text-[#99968e]">em {formatDate(entry.paidAt)}</p>}</div>
                    <p className={`text-right font-bold lg:text-left ${entry.kind === "Receber" ? "text-[#4f684f]" : "text-[#9a5339]"}`}><span aria-hidden="true">{entry.kind === "Receber" ? "+ " : "− "}</span>{formatCurrency(entry.amount)}</p>
                    <div className="col-span-2 flex justify-end lg:col-span-1">
                      {(entryStatus === "Pendente" || entryStatus === "Vencido") && <button type="button" onClick={() => updateEntry(entry.id, "pay")} className="flex h-8 items-center gap-1.5 rounded-md bg-[#2f7d4f] px-3 text-[10px] font-bold text-white hover:bg-[#256640]"><CheckCircle2 size={12} /> MARCAR PAGO</button>}
                      {entryStatus === "Pago" && <button type="button" onClick={() => updateEntry(entry.id, "reopen")} className="flex h-8 items-center gap-1.5 rounded-md border border-black/10 px-3 text-[10px] font-bold text-[#77756e] hover:border-[#073f8c] hover:text-[#073f8c]"><RotateCcw size={12} /> REABRIR</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-black/7 bg-white p-5" aria-labelledby="category-flow-title">
          <div className="flex items-start justify-between"><div><h2 id="category-flow-title" className="font-display text-xl">Fluxo por categoria</h2><p className="mt-1 text-[10px] text-[#88867e]">Valores reais dos lançamentos</p></div><CircleDollarSign size={19} className="text-[#ed1c24]" /></div>
          <div className="mt-4 flex gap-4 text-[9px] font-semibold text-[#77756e]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#5b7559]" /> Receber</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ed1c24]" /> Pagar</span></div>
          {categoryFlow.length === 0 ? <div className="grid place-items-center py-10 text-center"><p className="text-xs font-semibold">Sem dados para o fluxo.</p><p className="mt-1 text-[10px] text-[#88867e]">Crie um lançamento para começar.</p></div> : <div className="mt-5 space-y-5">{categoryFlow.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between gap-3"><p className="truncate text-[10px] font-semibold">{item.name}</p><p className="shrink-0 text-[9px] text-[#88867e]">{formatCurrency(item.total)}</p></div>
              <div className="mt-2 space-y-1.5" aria-label={`${item.name}: ${formatCurrency(item.incoming)} a receber e ${formatCurrency(item.outgoing)} a pagar`}>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0ec]"><div className="h-full rounded-full bg-[#5b7559]" style={{ width: `${(item.incoming / maxCategoryValue) * 100}%` }} /></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f4eceb]"><div className="h-full rounded-full bg-[#ed1c24]" style={{ width: `${(item.outgoing / maxCategoryValue) * 100}%` }} /></div>
              </div>
            </div>
          ))}</div>}
          <div className="mt-6 border-t border-black/7 pt-4"><div className="flex items-center justify-between text-[10px]"><span className="text-[#77756e]">Volume total</span><strong>{formatCurrency(categoryFlow.reduce((sum, item) => sum + item.total, 0))}</strong></div><p className="mt-2 text-[9px] leading-4 text-[#99968e]">Inclui lançamentos pagos, pendentes e vencidos; cancelados são desconsiderados.</p></div>
        </aside>
      </div>
    </div>
  );
}
