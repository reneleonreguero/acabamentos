"use client";

import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, CheckCircle2, ClipboardList, Search, SlidersHorizontal, Warehouse,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { formatCurrency } from "@/data/products";
import { demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct } from "@/lib/registrations";
import { createId, getBrowserStorageSnapshot, parseStorageArray, subscribeToStorage, writeStorage } from "@/lib/storage";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement, stockStatus, StockStatus } from "@/lib/stock";
import { useStorageCollection } from "@/lib/use-storage-collection";

export type StockTab = "posicao" | "movimentar" | "historico";

const statusStyles: Record<StockStatus, string> = {
  "Normal": "bg-[#dce8dc] text-[#4f684f]",
  "Baixo": "bg-[#fff4d0] text-[#87630b]",
  "Crítico": "bg-[#fff0e8] text-[#b83c1d]",
  "Sem estoque": "bg-[#f5e4e4] text-[#9a3b3b]",
};

const movementStyles: Record<StockMovement["type"], string> = {
  "Entrada": "bg-[#dce8dc] text-[#4f684f]",
  "Saída": "bg-[#fff0e8] text-[#b83c1d]",
  "Ajuste": "bg-[#e5edf7] text-[#315c88]",
};

function StatusBadge({ status }: { status: StockStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>{status}</span>;
}

function MovementTypeBadge({ type }: { type: StockMovement["type"] }) {
  const Icon = type === "Entrada" ? ArrowUpRight : type === "Saída" ? ArrowDownRight : SlidersHorizontal;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${movementStyles[type]}`}><Icon size={12} /> {type}</span>;
}

function productOf(products: RegisteredProduct[], productId: number) {
  return products.find((product) => product.id === productId);
}

function movementQuantityLabel(movement: Pick<StockMovement, "type" | "quantity">) {
  if (movement.type === "Saída") return `−${Math.abs(movement.quantity)}`;
  if (movement.type === "Entrada") return `+${Math.abs(movement.quantity)}`;
  if (movement.quantity > 0) return `+${movement.quantity}`;
  if (movement.quantity < 0) return `−${Math.abs(movement.quantity)}`;
  return "0";
}

function Posicao({ entries, products, onMove, onUpdateEntry }: { entries: StockEntry[]; products: RegisteredProduct[]; onMove: (productId: number) => void; onUpdateEntry: (entry: StockEntry) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState<"Todos" | StockStatus>("Todos");

  const categories = ["Todas", ...new Set(products.map((product) => product.category))];
  const rows = products
    .map((product) => ({ product, ...effectiveStock(entries, product) }))
    .map((row) => ({ ...row, status: stockStatus(row.quantity, row.min) }))
    .filter((row) => {
      const term = search.trim().toLowerCase();
      return (!term || row.product.name.toLowerCase().includes(term) || row.product.brand.toLowerCase().includes(term)) && (category === "Todas" || row.product.category === category) && (status === "Todos" || row.status === status);
    });

  const totalUnits = products.reduce((sum, product) => sum + effectiveStock(entries, product).quantity, 0);
  const totalValue = products.reduce((sum, product) => sum + effectiveStock(entries, product).quantity * product.cost, 0);
  const alerts = products.filter((product) => { const { quantity, min } = effectiveStock(entries, product); return stockStatus(quantity, min) !== "Normal"; }).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[[Boxes, "Itens cadastrados", String(products.length)], [Warehouse, "Unidades em estoque", String(totalUnits)], ["money", "Valor em estoque", formatCurrency(totalValue)], [AlertTriangle, "Em alerta", String(alerts)]].map(([Icon, label, value]) => {
          const CardIcon = Icon as typeof Boxes;
          return <article key={label as string} className="rounded-lg border border-black/7 bg-white p-4"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label as string}</p>{Icon === "money" ? <span className="grid h-7 w-7 place-items-center rounded-md bg-[#dce8dc] text-xs font-bold text-[#4f684f]">R$</span> : <span className="grid h-7 w-7 place-items-center rounded-md bg-[#e5edf7] text-[#315c88]"><CardIcon size={14} /></span>}</div><strong className="mt-3 block truncate font-display text-2xl font-normal">{value as string}</strong></article>;
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 lg:flex-row lg:items-center">
          <div><h3 className="font-display text-xl">Posição de estoque</h3><p className="mt-1 text-[10px] text-[#88867e]">Defina o mínimo e registre entradas, saídas e ajustes</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-black/10 px-3 sm:w-48 sm:flex-none"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar produto..." /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none">{categories.map((option) => <option key={option}>{option}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value as "Todos" | StockStatus)} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none"><option>Todos</option><option>Normal</option><option>Baixo</option><option>Crítico</option><option>Sem estoque</option></select>
          </div>
        </div>
        <div className="divide-y divide-black/6">
          {rows.length === 0 ? <div className="grid place-items-center p-12 text-center"><Boxes size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum produto encontrado.</p></div> : rows.map(({ product, quantity, min, status: rowStatus }) => (
            <div key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
              <div className="min-w-0 flex-1 basis-48"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-[#88867e]">{product.category} · {product.brand} · {product.size}</p></div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-[#88867e]">MÍN.<input type="number" min={0} value={min} onChange={(event) => onUpdateEntry({ productId: product.id, quantity, min: Math.max(0, Number(event.target.value)) })} className="h-9 w-16 rounded-md border border-black/10 px-2 text-right text-xs font-semibold text-[#282824] outline-none focus:border-[#073f8c]" /></label>
              <div className="min-w-20 text-center"><p className="font-display text-2xl font-normal">{quantity}</p><p className="text-[9px] text-[#99968e]">{product.unit}{product.price !== undefined ? ` · ${formatCurrency(product.price)}` : " · sob consulta"}</p></div>
              <StatusBadge status={rowStatus} />
              <button onClick={() => onMove(product.id)} className="h-10 shrink-0 rounded-md bg-[#073f8c] px-4 text-xs font-bold text-white hover:bg-[#ed1c24]">MOVIMENTAR</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Movimentar({ entries, movements, products, initialProductId, onUpsertEntry, onAddMovement }: { entries: StockEntry[]; movements: StockMovement[]; products: RegisteredProduct[]; initialProductId: number | null; onUpsertEntry: (entry: StockEntry) => void; onAddMovement: (movement: StockMovement) => void }) {
  const [productId, setProductId] = useState<number | null>(initialProductId ?? products[0]?.id ?? null);
  const [type, setType] = useState<StockMovement["type"]>("Entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const product = productId === null ? products[0] : productOf(products, productId) ?? products[0];
  if (!product) return <div className="grid place-items-center rounded-lg border border-black/7 bg-white p-12 text-center"><Boxes size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum produto ativo disponível.</p></div>;

  const current = effectiveStock(entries, product);
  const parsed = Math.max(0, Math.floor(Number(quantity) || 0));
  const result = type === "Entrada" ? current.quantity + parsed : type === "Saída" ? Math.max(0, current.quantity - parsed) : parsed;
  const movementQuantity = type === "Ajuste" ? result - current.quantity : parsed;
  const invalid = type === "Ajuste" ? quantity === "" : parsed <= 0 || (type === "Saída" && parsed > current.quantity);

  function save() {
    if (invalid) return;
    const label = reason.trim() || (type === "Entrada" ? "Reposição de estoque" : type === "Saída" ? "Baixa de estoque" : "Ajuste de contagem");
    onUpsertEntry({ productId: product.id, quantity: result, min: current.min });
    onAddMovement({ id: createId("MOV"), productId: product.id, type, quantity: movementQuantity, reason: label, createdAt: new Date().toISOString(), user: "Ana" });
    setMessage(`${type} de ${movementQuantityLabel({ type, quantity: movementQuantity })} ${product.unit} registrada em ${product.name}. Novo saldo: ${result}.`);
    setQuantity("");
    setReason("");
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-lg border border-black/7 bg-white p-5">
        <h3 className="font-display text-xl">Registrar movimentação</h3>
        <p className="mt-1 text-[10px] text-[#88867e]">Atualize o saldo e mantenha o histórico do protótipo</p>
        {message && <div className="mt-4 flex items-start gap-3 rounded-md bg-[#dce8dc] p-3 text-xs text-[#4f684f]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><p>{message}</p></div>}
        <div className="mt-5 grid gap-4">
          <label className="text-xs font-bold text-[#77756e] uppercase">Produto<select value={product.id} onChange={(event) => { setProductId(Number(event.target.value)); setMessage(null); }} className="mt-2 h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-[#073f8c]">{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.size}</option>)}</select></label>
          <div><p className="text-xs font-bold text-[#77756e] uppercase">Tipo</p><div className="mt-2 grid grid-cols-3 gap-2">{(Object.keys(movementStyles) as StockMovement["type"][]).map((option) => (
            <button key={option} onClick={() => { setType(option); setMessage(null); }} className={`flex h-11 items-center justify-center gap-2 rounded-md text-xs font-bold ${type === option ? "bg-[#073f8c] text-white" : "border border-black/10 text-[#55534c]"}`}>{option === "Entrada" ? <ArrowUpRight size={15} /> : option === "Saída" ? <ArrowDownRight size={15} /> : <SlidersHorizontal size={15} />} {option}</button>
          ))}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#77756e] uppercase">{type === "Ajuste" ? "Novo saldo" : "Quantidade"}<input inputMode="numeric" value={quantity} onChange={(event) => { setQuantity(event.target.value.replace(/\D/g, "")); setMessage(null); }} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-semibold outline-none focus:border-[#073f8c]" placeholder="0" /></label>
            <label className="text-xs font-bold text-[#77756e] uppercase">Motivo<input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 text-sm font-medium outline-none focus:border-[#073f8c]" placeholder="Ex.: compra, venda, avaria" /></label>
          </div>
        </div>
        <button onClick={save} disabled={invalid} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#ed1c24] text-sm font-bold text-white enabled:hover:bg-[#bd1017] disabled:opacity-40"><ClipboardList size={18} /> CONFIRMAR MOVIMENTAÇÃO</button>
        <p className="mt-3 text-center text-[10px] text-[#99968e]">Movimentação simulada, sem impacto fiscal.</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-black/7 bg-white p-5">
          <p className="text-[10px] font-bold tracking-wider text-[#99968e] uppercase">Posição atual</p>
          <h3 className="font-display mt-1 text-2xl">{product.name}</h3>
          <p className="mt-1 text-[10px] text-[#88867e]">{product.category} · {product.brand}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-[#f7f8fa] p-3"><p className="text-[9px] text-[#99968e] uppercase">Atual</p><p className="font-display mt-1 text-2xl">{current.quantity}</p></div>
             <div className="rounded-md bg-[#f7f8fa] p-3"><p className="text-[9px] text-[#99968e] uppercase">Movimento</p><p className="font-display mt-1 text-2xl">{movementQuantityLabel({ type, quantity: movementQuantity })}</p></div>
            <div className="rounded-md bg-[#eef3fa] p-3"><p className="text-[9px] text-[#5f6b7a] uppercase">Resultante</p><p className="font-display mt-1 text-2xl text-[#073f8c]">{result}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/7 pt-4"><span className="text-xs text-[#77756e]">Mínimo definido</span><span className="text-xs font-bold">{current.min} {product.unit}</span></div>
        </div>
        <div className="rounded-lg border border-black/7 bg-white p-5">
          <h4 className="font-display text-lg">Últimas movimentações do item</h4>
           <div className="mt-3 divide-y divide-black/6">{movements.filter((movement) => movement.productId === product.id).slice(0, 4).length === 0 ? <p className="py-4 text-xs text-[#88867e]">Nenhuma movimentação registrada para este item.</p> : movements.filter((movement) => movement.productId === product.id).slice(0, 4).map((movement) => (
             <div key={movement.id} className="flex items-center justify-between gap-3 py-3"><div><MovementTypeBadge type={movement.type} /><p className="mt-1 text-[10px] text-[#88867e]">{movement.reason}</p></div><div className="text-right"><p className="text-xs font-bold">{movementQuantityLabel(movement)}</p><p className="text-[9px] text-[#99968e]">{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</p></div></div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

function Historico({ movements, products }: { movements: StockMovement[]; products: RegisteredProduct[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"Todos" | StockMovement["type"]>("Todos");
  const filtered = movements.filter((movement) => {
    const term = search.trim().toLowerCase();
    const name = productOf(products, movement.productId)?.name.toLowerCase() ?? "";
    return (!term || name.includes(term) || movement.reason.toLowerCase().includes(term)) && (type === "Todos" || movement.type === type);
  });

  return (
    <div className="overflow-hidden rounded-lg border border-black/7 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 md:flex-row md:items-center">
        <div><h3 className="font-display text-xl">Histórico de movimentações</h3><p className="mt-1 text-[10px] text-[#88867e]">{filtered.length} registro(s) no protótipo</p></div>
        <div className="flex gap-2"><label className="flex h-10 w-full items-center gap-2 rounded-md border border-black/10 px-3 md:w-52"><Search size={15} className="text-[#89877e]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar item ou motivo..." /></label><select value={type} onChange={(event) => setType(event.target.value as "Todos" | StockMovement["type"])} className="h-10 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold outline-none"><option>Todos</option><option>Entrada</option><option>Saída</option><option>Ajuste</option></select></div>
      </div>
      {filtered.length === 0 ? <div className="grid place-items-center p-12 text-center"><ClipboardList size={28} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhuma movimentação encontrada.</p><p className="mt-1 text-[10px] text-[#88867e]">Registre entradas e saídas na aba Movimentar.</p></div> : <div className="divide-y divide-black/6">{filtered.map((movement) => (
        <div key={movement.id} className="grid gap-2 p-4 sm:grid-cols-[.7fr_1.2fr_.8fr_.6fr_.7fr] sm:items-center sm:gap-4">
          <div><p className="text-xs font-bold text-[#ed1c24]">{movement.id}</p><p className="mt-1 text-[9px] text-[#99968e]">{new Date(movement.createdAt).toLocaleDateString("pt-BR")} · {movement.user}</p></div>
           <div className="min-w-0"><p className="truncate text-xs font-semibold">{productOf(products, movement.productId)?.name ?? `Produto ${movement.productId}`}</p><p className="mt-1 truncate text-[9px] text-[#88867e]">{movement.reason}</p></div>
           <MovementTypeBadge type={movement.type} />
           <p className="text-xs font-bold sm:text-center">{movementQuantityLabel(movement)}</p>
           <p className="text-[10px] text-[#99968e] sm:text-right">{productOf(products, movement.productId)?.unit}</p>
        </div>
      ))}</div>}
    </div>
  );
}

export function StockView({ tab, onTabChange }: { tab: StockTab; onTabChange: (tab: StockTab) => void }) {
  const registeredProducts = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const serializedEntries = useSyncExternalStore(subscribeToStorage, () => getBrowserStorageSnapshot(STOCK_KEY), () => "[]");
  const serializedMovements = useSyncExternalStore(subscribeToStorage, () => getBrowserStorageSnapshot(STOCK_MOVEMENTS_KEY), () => "[]");
  const entries = useMemo(() => parseStorageArray<StockEntry>(serializedEntries), [serializedEntries]);
  const movements = useMemo(() => parseStorageArray<StockMovement>(serializedMovements), [serializedMovements]);
  const activeProducts = registeredProducts.filter((product) => product.active);
  const [moveProduct, setMoveProduct] = useState<number | null>(null);

  function upsertEntry(entry: StockEntry) {
    const next = entries.some((item) => item.productId === entry.productId)
      ? entries.map((item) => item.productId === entry.productId ? entry : item)
      : [...entries, entry];
    writeStorage(STOCK_KEY, next);
  }

  function addMovement(movement: StockMovement) {
    writeStorage(STOCK_MOVEMENTS_KEY, [movement, ...movements]);
  }

  function openMovement(productId: number) {
    setMoveProduct(productId);
    onTabChange("movimentar");
  }

  const alertCount = activeProducts.filter((product) => { const { quantity, min } = effectiveStock(entries, product); return stockStatus(quantity, min) !== "Normal"; }).length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="text-xs text-[#77756e]">Estoque</p><h2 className="font-display mt-1 text-3xl md:text-4xl">Depósito</h2><p className="mt-1 hidden text-sm text-[#77756e] sm:block">Saldo, mínimo e movimentações simuladas dos produtos.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onTabChange("posicao")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "posicao" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>POSIÇÃO</button>
          <button onClick={() => onTabChange("movimentar")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "movimentar" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>MOVIMENTAR</button>
          <button onClick={() => onTabChange("historico")} className={`h-10 rounded-md px-4 text-xs font-bold ${tab === "historico" ? "bg-[#073f8c] text-white" : "border border-black/10 bg-white text-[#77756e]"}`}>HISTÓRICO{alertCount > 0 ? ` (${alertCount})` : ""}</button>
        </div>
      </div>
       {tab === "posicao" ? <Posicao entries={entries} products={activeProducts} onMove={openMovement} onUpdateEntry={upsertEntry} /> : tab === "movimentar" ? <Movimentar key={moveProduct ?? "padrao"} entries={entries} movements={movements} products={activeProducts} initialProductId={moveProduct} onUpsertEntry={upsertEntry} onAddMovement={addMovement} /> : <Historico movements={movements} products={registeredProducts} />}
      {alertCount > 0 && <p className="mt-4 flex items-center gap-2 text-[10px] text-[#9a5339]"><AlertTriangle size={13} /> {alertCount} produto(s) exigem reposição com base no estoque mínimo definido.</p>}
    </div>
  );
}
