"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  PackageCheck,
  Play,
  Save,
} from "lucide-react";
import { useRef, useState } from "react";
import { demoInventories, INVENTORIES_KEY, Inventory, InventoryItem } from "@/lib/inventory";
import { demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct } from "@/lib/registrations";
import { createId, readStorage, writeStorage } from "@/lib/storage";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement } from "@/lib/stock";
import { useStorageCollection } from "@/lib/use-storage-collection";

type InventoryTab = "contagens" | "nova";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function productOf(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId);
}

function countedItems(inventory: Inventory) {
  return inventory.items.filter((item) => item.counted !== undefined).length;
}

function divergentItems(inventory: Inventory) {
  return inventory.items.filter((item) => item.counted !== undefined && item.counted !== item.expected).length;
}

function Progress({ inventory }: { inventory: Inventory }) {
  const counted = countedItems(inventory);
  const percent = inventory.items.length === 0 ? 0 : Math.round((counted / inventory.items.length) * 100);

  return (
    <div className="min-w-32" aria-label={`${percent}% da contagem preenchida`}>
      <div className="mb-1.5 flex items-center justify-between text-[9px] font-bold text-[#88867e]">
        <span>{counted}/{inventory.items.length} ITENS</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e7e2]">
        <div className="h-full rounded-full bg-[#073f8c] transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ inventory }: { inventory: Inventory }) {
  const complete = inventory.status === "Concluído";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? "bg-[#dce8dc] text-[#4f684f]" : "bg-[#fff4d0] text-[#87630b]"}`}>
      {complete ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
      {inventory.status}
    </span>
  );
}

function CountsList({ inventories, products, onOpen, onNew }: { inventories: Inventory[]; products: RegisteredProduct[]; onOpen: (inventory: Inventory) => void; onNew: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...inventories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inProgress = inventories.filter((inventory) => inventory.status === "Em andamento");
  const completed = inventories.filter((inventory) => inventory.status === "Concluído");
  const differences = completed.reduce((total, inventory) => total + divergentItems(inventory), 0);

  const cards = [
    { label: "Em andamento", value: inProgress.length, hint: "contagens abertas", Icon: Clock3, tone: "bg-[#fff4d0] text-[#87630b]" },
    { label: "Concluídas", value: completed.length, hint: "inventários finalizados", Icon: PackageCheck, tone: "bg-[#dce8dc] text-[#4f684f]" },
    { label: "Divergências", value: differences, hint: "itens ajustados no histórico", Icon: AlertTriangle, tone: "bg-[#fff0e8] text-[#b83c1d]" },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, hint, Icon, tone }) => (
          <article key={label} className="rounded-lg border border-black/7 bg-white p-4">
            <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label}</p><span className={`grid h-7 w-7 place-items-center rounded-md ${tone}`}><Icon size={14} /></span></div>
            <strong className="font-display mt-3 block text-2xl font-normal">{value}</strong>
            <p className="mt-1 text-[9px] text-[#99968e]">{hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 sm:flex-row sm:items-center">
          <div><h3 className="font-display text-xl">Contagens de estoque</h3><p className="mt-1 text-[10px] text-[#88867e]">Abra uma contagem em andamento ou consulte os inventários concluídos</p></div>
          <button onClick={onNew} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ed1c24] px-4 text-xs font-bold text-white hover:bg-[#bd1017]"><ClipboardList size={15} /> NOVA CONTAGEM</button>
        </div>

        {sorted.length === 0 ? (
          <div className="grid place-items-center p-12 text-center"><ClipboardCheck size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhuma contagem registrada.</p></div>
        ) : (
          <div className="divide-y divide-black/6">
            {sorted.map((inventory) => {
              const isExpanded = expanded === inventory.id;
              const differencesCount = divergentItems(inventory);
              return (
                <div key={inventory.id}>
                  <div className="grid gap-3 p-4 sm:grid-cols-[1fr_.75fr_.8fr_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0"><p className="text-xs font-bold text-[#ed1c24]">{inventory.id}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{formatDate(inventory.createdAt)} · {inventory.user}</p></div>
                    <StatusBadge inventory={inventory} />
                    <Progress inventory={inventory} />
                    <div className="flex justify-end gap-2">
                      {inventory.status === "Em andamento" ? (
                        <button onClick={() => onOpen(inventory)} className="h-9 rounded-md bg-[#073f8c] px-3 text-[10px] font-bold text-white hover:bg-[#ed1c24]">ABRIR</button>
                      ) : (
                        <button onClick={() => setExpanded(isExpanded ? null : inventory.id)} aria-expanded={isExpanded} aria-controls={`details-${inventory.id}`} className="flex h-9 items-center gap-1.5 rounded-md border border-black/10 px-3 text-[10px] font-bold text-[#55534c] hover:border-[#073f8c] hover:text-[#073f8c]">DETALHES <ChevronDown size={13} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                      )}
                    </div>
                  </div>

                  {inventory.status === "Concluído" && isExpanded && (
                    <div id={`details-${inventory.id}`} className="border-t border-black/6 bg-[#f7f8fa] px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-[#77756e]">Concluído em {inventory.completedAt ? formatDate(inventory.completedAt) : "data não informada"}</p><p className={`text-[10px] font-bold ${differencesCount > 0 ? "text-[#b83c1d]" : "text-[#4f684f]"}`}>{differencesCount} divergência(s)</p></div>
                      {inventory.notes && <p className="mt-2 text-[10px] text-[#77756e]">Observações: {inventory.notes}</p>}
                      <div className="mt-3 overflow-x-auto rounded-md border border-black/7 bg-white">
                        <table className="w-full min-w-[560px] text-left text-xs">
                          <thead className="border-b border-black/7 text-[9px] tracking-wider text-[#99968e] uppercase"><tr><th className="px-3 py-2 font-bold">Produto</th><th className="px-3 py-2 text-right font-bold">Esperado</th><th className="px-3 py-2 text-right font-bold">Contado</th><th className="px-3 py-2 text-right font-bold">Diferença</th></tr></thead>
                          <tbody className="divide-y divide-black/6">{inventory.items.map((item) => {
                            const product = productOf(products, item.productId);
                            const difference = (item.counted ?? 0) - item.expected;
                            return <tr key={item.productId}><td className="px-3 py-2.5"><span className="font-semibold">{product?.name ?? `Produto ${item.productId}`}</span><span className="ml-1 text-[9px] text-[#99968e]">{product?.sku}</span></td><td className="px-3 py-2.5 text-right text-[#77756e]">{item.expected} {product?.unit}</td><td className="px-3 py-2.5 text-right font-semibold">{item.counted ?? "—"} {product?.unit}</td><td className={`px-3 py-2.5 text-right font-bold ${difference === 0 ? "text-[#4f684f]" : "text-[#b83c1d]"}`}>{difference > 0 ? "+" : ""}{difference}</td></tr>;
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CountEditor({ inventory, products, message, onChange, onSave, onComplete, onStart }: { inventory: Inventory | null; products: RegisteredProduct[]; message: string | null; onChange: (inventory: Inventory) => void; onSave: () => void; onComplete: () => void; onStart: () => void }) {
  if (!inventory) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-black/10 bg-white p-8 text-center">
        <div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e5edf7] text-[#315c88]"><ClipboardList size={25} /></span><h3 className="font-display mt-5 text-2xl">Inicie uma nova contagem</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#77756e]">O saldo atual de todos os produtos ativos será capturado como esperado. Depois, informe as quantidades encontradas no depósito.</p><button onClick={onStart} disabled={products.filter((product) => product.active).length === 0} className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-[#ed1c24] px-6 text-xs font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><Play size={16} /> INICIAR INVENTÁRIO</button>{products.filter((product) => product.active).length === 0 && <p className="mt-3 text-[10px] font-semibold text-[#87630b]">Ative ou cadastre um produto no módulo Cadastros antes de iniciar.</p>}</div>
      </div>
    );
  }

  const counted = countedItems(inventory);
  const differences = divergentItems(inventory);
  const allCounted = inventory.items.length > 0 && counted === inventory.items.length;

  function updateItem(productId: number, value: string) {
    if (!inventory) return;
    const countedValue = value === "" ? undefined : Math.max(0, Number(value));
    onChange({ ...inventory, items: inventory.items.map((item) => item.productId === productId ? { ...item, counted: countedValue } : item) });
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.3fr_.7fr]">
      <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="border-b border-black/7 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-[#ed1c24]">{inventory.id}</p><h3 className="font-display mt-1 text-xl">Contagem física</h3><p className="mt-1 text-[10px] text-[#88867e]">Iniciada em {formatDate(inventory.createdAt)}</p></div><StatusBadge inventory={inventory} /></div>
          {message && <div role="status" className="mt-4 flex items-start gap-2 rounded-md bg-[#dce8dc] p-3 text-xs text-[#4f684f]"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {message}</div>}
        </div>
        <div className="hidden grid-cols-[1fr_.55fr_.65fr_.55fr] gap-3 border-b border-black/6 px-5 py-3 text-[9px] font-bold tracking-wider text-[#99968e] uppercase sm:grid"><span>Produto</span><span className="text-right">Esperado</span><span className="text-right">Contado</span><span className="text-right">Diferença</span></div>
        <div className="divide-y divide-black/6">
          {inventory.items.map((item) => {
            const product = productOf(products, item.productId);
            const difference = item.counted === undefined ? null : item.counted - item.expected;
            return (
              <div key={item.productId} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1fr_.55fr_.65fr_.55fr] sm:items-center sm:px-5">
                <div className="col-span-2 min-w-0 sm:col-span-1"><p className="truncate text-xs font-semibold">{product?.name ?? `Produto ${item.productId}`}</p><p className="mt-1 text-[9px] text-[#88867e]">{product?.sku} · {product?.brand} · {product?.unit}</p></div>
                <div className="text-left sm:text-right"><p className="text-[9px] font-bold text-[#99968e] uppercase sm:hidden">Esperado</p><p className="mt-1 text-xs font-semibold sm:mt-0">{item.expected}</p></div>
                <label className="text-right"><span className="text-[9px] font-bold text-[#99968e] uppercase sm:sr-only">Contado</span><input type="number" min={0} step="any" inputMode="decimal" value={item.counted ?? ""} onChange={(event) => updateItem(item.productId, event.target.value)} aria-label={`Quantidade contada de ${product?.name ?? `produto ${item.productId}`}`} className="mt-1 h-10 w-full max-w-28 rounded-md border border-black/10 px-3 text-right text-sm font-bold outline-none focus:border-[#073f8c] sm:mt-0" placeholder="—" /></label>
                <div className="col-span-2 text-right sm:col-span-1"><span className={`inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${difference === null ? "bg-[#f1f1ee] text-[#88867e]" : difference === 0 ? "bg-[#dce8dc] text-[#4f684f]" : "bg-[#fff0e8] text-[#b83c1d]"}`}>{difference === null ? "Pendente" : `${difference > 0 ? "+" : ""}${difference}`}</span></div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4">
        <div className="rounded-lg border border-black/7 bg-white p-5">
          <p className="text-[10px] font-bold tracking-wider text-[#99968e] uppercase">Progresso</p>
          <div className="mt-4"><Progress inventory={inventory} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center"><div className="rounded-md bg-[#f7f8fa] p-3"><p className="font-display text-2xl">{inventory.items.length - counted}</p><p className="text-[9px] text-[#88867e] uppercase">Pendentes</p></div><div className={`rounded-md p-3 ${differences > 0 ? "bg-[#fff0e8]" : "bg-[#dce8dc]"}`}><p className={`font-display text-2xl ${differences > 0 ? "text-[#b83c1d]" : "text-[#4f684f]"}`}>{differences}</p><p className="text-[9px] text-[#88867e] uppercase">Divergências</p></div></div>
          <label className="mt-5 block text-[10px] font-bold text-[#77756e] uppercase">Responsável<input value={inventory.user} onChange={(event) => onChange({ ...inventory, user: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-black/10 px-3 text-xs font-semibold outline-none focus:border-[#073f8c]" /></label>
          <label className="mt-4 block text-[10px] font-bold text-[#77756e] uppercase">Observações<textarea value={inventory.notes} onChange={(event) => onChange({ ...inventory, notes: event.target.value })} rows={3} className="mt-2 w-full resize-none rounded-md border border-black/10 px-3 py-2 text-xs outline-none focus:border-[#073f8c]" placeholder="Setor, ocorrência ou conferência..." /></label>
          <div className="mt-5 grid gap-2"><button onClick={onSave} className="flex h-11 items-center justify-center gap-2 rounded-md border border-black/10 text-xs font-bold text-[#55534c] hover:border-[#073f8c] hover:text-[#073f8c]"><Save size={15} /> SALVAR EM ANDAMENTO</button><button onClick={onComplete} disabled={!allCounted || !inventory.user.trim()} className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-xs font-bold text-white enabled:hover:bg-[#bd1017] disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={16} /> CONCLUIR INVENTÁRIO</button></div>
          {!allCounted && <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-4 text-[#87630b]"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> Informe a contagem de todos os itens para concluir.</p>}
        </div>
      </aside>
    </div>
  );
}

export function InventoryView() {
  const inventories = useStorageCollection<Inventory>(INVENTORIES_KEY, demoInventories);
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const stockEntries = useStorageCollection<StockEntry>(STOCK_KEY, []);
  const stockMovements = useStorageCollection<StockMovement>(STOCK_MOVEMENTS_KEY, []);
  const [tab, setTab] = useState<InventoryTab>("contagens");
  const [draft, setDraft] = useState<Inventory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const completionLock = useRef<string | null>(null);

  function startInventory() {
    const items: InventoryItem[] = products
      .filter((product) => product.active)
      .map((product) => ({ productId: product.id, expected: effectiveStock(stockEntries, product).quantity }));
    setDraft({ id: createId("INV"), status: "Em andamento", createdAt: new Date().toISOString(), notes: "", user: "Ana", items });
    setMessage(null);
    setTab("nova");
  }

  function openInventory(inventory: Inventory) {
    if (inventory.status !== "Em andamento") return;
    setDraft({ ...inventory, items: inventory.items.map((item) => ({ ...item })) });
    setMessage(null);
    setTab("nova");
  }

  function saveDraft() {
    if (!draft || draft.status !== "Em andamento") return;
    const current = readStorage<Inventory[]>(INVENTORIES_KEY, inventories);
    const saved = current.find((inventory) => inventory.id === draft.id);
    if (saved?.status === "Concluído") {
      setMessage("Este inventário já foi concluído e não pode mais ser alterado.");
      return;
    }
    const next = current.some((inventory) => inventory.id === draft.id)
      ? current.map((inventory) => inventory.id === draft.id ? draft : inventory)
      : [draft, ...current];
    writeStorage(INVENTORIES_KEY, next);
    setMessage("Contagem salva. Você pode continuar agora ou reabri-la mais tarde.");
  }

  function completeInventory() {
    if (!draft || draft.status !== "Em andamento" || completionLock.current === draft.id) return;
    if (draft.items.length === 0 || draft.items.some((item) => item.counted === undefined) || !draft.user.trim()) return;

    const currentInventories = readStorage<Inventory[]>(INVENTORIES_KEY, inventories);
    if (currentInventories.some((inventory) => inventory.id === draft.id && inventory.status === "Concluído")) {
      setMessage("Este inventário já foi concluído.");
      return;
    }

    completionLock.current = draft.id;
    const completedAt = new Date().toISOString();
    const completed: Inventory = { ...draft, status: "Concluído", completedAt };
    const currentEntries = readStorage<StockEntry[]>(STOCK_KEY, stockEntries);
    const currentMovements = readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, stockMovements);
    const nextEntries = [...currentEntries];
    const adjustments: StockMovement[] = [];

    completed.items.forEach((item) => {
      const product = productOf(products, item.productId);
      if (!product || item.counted === undefined) return;
      const current = effectiveStock(nextEntries, product);
      const entry: StockEntry = { productId: item.productId, quantity: item.counted, min: current.min };
      const index = nextEntries.findIndex((saved) => saved.productId === item.productId);
      if (index >= 0) nextEntries[index] = entry; else nextEntries.push(entry);

      const difference = item.counted - current.quantity;
      if (difference !== 0) adjustments.push({
        id: createId("MOV"),
        productId: item.productId,
        type: "Ajuste",
        quantity: difference,
        reason: `Inventário ${completed.id}: saldo ajustado de ${current.quantity} para ${item.counted}`,
        createdAt: completedAt,
        user: completed.user.trim(),
      });
    });

    const nextInventories = currentInventories.some((inventory) => inventory.id === completed.id)
      ? currentInventories.map((inventory) => inventory.id === completed.id ? completed : inventory)
      : [completed, ...currentInventories];
    writeStorage(STOCK_KEY, nextEntries);
    if (adjustments.length > 0) writeStorage(STOCK_MOVEMENTS_KEY, [...adjustments, ...currentMovements]);
    writeStorage(INVENTORIES_KEY, nextInventories);
    setDraft(null);
    setMessage(null);
    setTab("contagens");
  }

  function selectTab(next: InventoryTab) {
    setTab(next);
    setMessage(null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-xs text-[#77756e]">Estoque</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Inventário</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Conte o estoque físico e registre divergências com rastreabilidade.</p></div>
        <div role="tablist" aria-label="Seções do inventário" className="flex gap-2">
          <button role="tab" aria-selected={tab === "contagens"} onClick={() => selectTab("contagens")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "contagens" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>CONTAGENS</button>
          <button role="tab" aria-selected={tab === "nova"} onClick={() => selectTab("nova")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "nova" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>NOVA CONTAGEM</button>
        </div>
      </div>

      <div role="tabpanel">
        {tab === "contagens"
          ? <CountsList inventories={inventories} products={products} onOpen={openInventory} onNew={startInventory} />
          : <CountEditor inventory={draft} products={products} message={message} onChange={(next) => { setDraft(next); setMessage(null); }} onSave={saveDraft} onComplete={completeInventory} onStart={startInventory} />}
      </div>
    </div>
  );
}
