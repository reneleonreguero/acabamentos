"use client";

import {
  Boxes,
  Building2,
  CheckCircle2,
  CircleOff,
  Edit3,
  PackagePlus,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { formatCurrency } from "@/data/products";
import {
  Customer,
  CUSTOMERS_KEY,
  demoCustomers,
  demoProducts,
  demoSuppliers,
  RegisteredProduct,
  REGISTERED_PRODUCTS_KEY,
  Supplier,
  SUPPLIERS_KEY,
} from "@/lib/registrations";
import { createId, writeStorage } from "@/lib/storage";
import { effectiveStock, STOCK_KEY, StockEntry } from "@/lib/stock";
import { assetPath } from "@/lib/asset";
import { useStorageCollection } from "@/lib/use-storage-collection";

type RegistrationTab = "customers" | "products" | "suppliers";
type EditingRecord = Customer | RegisteredProduct | Supplier | null;

const fieldClass = "mt-1.5 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-xs outline-none focus:border-[#073f8c]";
const areaClass = "mt-1.5 min-h-20 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#073f8c]";
const labelClass = "text-[10px] font-bold tracking-wide text-[#77756e] uppercase";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

function uniqueSlug(name: string, products: RegisteredProduct[]) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "produto";
  const slugs = new Set(products.map((product) => product.slug));
  let slug = base;
  let suffix = 2;
  while (slugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? "bg-[#dce8dc] text-[#4f684f]" : "bg-[#f1f1ef] text-[#77756e]"}`}>{active ? "ATIVO" : "INATIVO"}</span>;
}

function SummaryCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof Users; tone: string }) {
  return (
    <article className="min-w-0 rounded-lg border border-black/7 bg-white p-4">
      <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold text-[#77756e]">{label}</p><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${tone}`}><Icon size={14} /></span></div>
      <strong className="font-display mt-3 block truncate text-2xl font-normal">{value}</strong>
      <p className="mt-1 text-[9px] text-[#99968e]">{hint}</p>
    </article>
  );
}

function CustomerForm({ customer, customers, onSave, onClose }: { customer?: Customer; customers: Customer[]; onSave: (value: Customer, message: string) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    document: customer?.document ?? "",
    city: customer?.city ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
    active: customer?.active ?? true,
  });
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Informe ao menos o nome e o telefone do cliente.");
      return;
    }
    let id = customer?.id ?? createId("CLI");
    while (!customer && customers.some((item) => item.id === id)) id = createId("CLI");
    onSave({ ...form, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), document: form.document.trim(), city: form.city.trim(), address: form.address.trim(), notes: form.notes.trim(), id, createdAt: customer?.createdAt ?? new Date().toISOString() }, customer ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className={`${labelClass} sm:col-span-2`}>Nome / razão social *<input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Telefone *<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>CPF / CNPJ<input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Cidade / UF<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={fieldClass} /></label>
      <label className={`${labelClass} sm:col-span-2`}>Endereço<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={fieldClass} /></label>
      <label className={`${labelClass} sm:col-span-2`}>Observações<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={areaClass} /></label>
      <ActiveField active={form.active} onChange={(active) => setForm({ ...form, active })} />
      {error && <p role="alert" className="text-xs font-semibold text-[#b83c1d] sm:col-span-2">{error}</p>}
      <FormActions onClose={onClose} />
    </form>
  );
}

function SupplierForm({ supplier, suppliers, onSave, onClose }: { supplier?: Supplier; suppliers: Supplier[]; onSave: (value: Supplier, message: string) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contact: supplier?.contact ?? "",
    email: supplier?.email ?? "",
    city: supplier?.city ?? "",
    categories: supplier?.categories.join(", ") ?? "",
    notes: supplier?.notes ?? "",
    active: supplier?.active ?? true,
  });
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setError("Informe ao menos o nome e o contato do fornecedor.");
      return;
    }
    let id = supplier?.id ?? createId("FOR");
    while (!supplier && suppliers.some((item) => item.id === id)) id = createId("FOR");
    const categories = form.categories.split(",").map((category) => category.trim()).filter(Boolean);
    onSave({ id, name: form.name.trim(), contact: form.contact.trim(), email: form.email.trim(), city: form.city.trim(), categories, notes: form.notes.trim(), active: form.active }, supplier ? "Fornecedor atualizado com sucesso." : "Fornecedor cadastrado com sucesso.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className={`${labelClass} sm:col-span-2`}>Nome / razão social *<input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Contato *<input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Cidade / UF<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Categorias<input value={form.categories} onChange={(event) => setForm({ ...form, categories: event.target.value })} className={fieldClass} placeholder="Pisos, Portas, Ferragens" /><span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-[#99968e]">Separe as categorias por vírgula.</span></label>
      <label className={`${labelClass} sm:col-span-2`}>Observações<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={areaClass} /></label>
      <ActiveField active={form.active} onChange={(active) => setForm({ ...form, active })} />
      {error && <p role="alert" className="text-xs font-semibold text-[#b83c1d] sm:col-span-2">{error}</p>}
      <FormActions onClose={onClose} />
    </form>
  );
}

function ProductForm({ product, products, onSave, onClose }: { product?: RegisteredProduct; products: RegisteredProduct[]; onSave: (value: RegisteredProduct, message: string) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "",
    brand: product?.brand ?? "",
    price: product?.price === undefined ? "" : String(product.price),
    cost: product ? String(product.cost) : "",
    unit: product?.unit ?? "un.",
    size: product?.size ?? "",
    finish: product?.finish ?? "",
    color: product?.color ?? "",
    stock: product ? String(product.stock) : "0",
    active: product?.active ?? true,
  });
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sku = form.sku.trim();
    const price = form.price.trim() === "" ? undefined : parseNumber(form.price);
    const cost = parseNumber(form.cost);
    const stock = Math.max(0, Math.floor(parseNumber(form.stock)));
    if (!form.name.trim() || !sku || !form.category.trim() || !form.brand.trim() || !form.size.trim() || !form.finish.trim() || !form.color.trim()) {
      setError("Preencha todos os campos obrigatórios do produto.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0 || (price !== undefined && (!Number.isFinite(price) || price < 0)) || (!product && !Number.isFinite(stock))) {
      setError("Informe valores numéricos válidos e não negativos.");
      return;
    }
    if (products.some((item) => item.id !== product?.id && normalize(item.sku) === normalize(sku))) {
      setError("Este SKU já está cadastrado. Informe um SKU exclusivo.");
      return;
    }

    if (product) {
      const updated: RegisteredProduct = { ...product, name: form.name.trim(), sku, category: form.category.trim(), brand: form.brand.trim(), cost, unit: form.unit, size: form.size.trim(), finish: form.finish.trim(), color: form.color.trim(), active: form.active };
      if (price === undefined) delete updated.price;
      else updated.price = price;
      onSave(updated, "Produto atualizado com sucesso.");
      return;
    }

    const id = products.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
    const created: RegisteredProduct = {
      id,
      slug: uniqueSlug(form.name, products),
      name: form.name.trim(),
      sku,
      category: form.category.trim(),
      brand: form.brand.trim(),
      cost,
      unit: form.unit,
      image: assetPath("/products/mostruario.webp"),
      size: form.size.trim(),
      finish: form.finish.trim(),
      color: form.color.trim(),
      stock,
      active: form.active,
      description: `${form.name.trim()} cadastrado no ERP da Casa São José.`,
      ...(price === undefined ? {} : { price }),
    };
    onSave(created, "Produto cadastrado com sucesso.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className={`${labelClass} sm:col-span-2`}>Nome *<input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>SKU *<input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Categoria *<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Marca *<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Unidade *<select required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as RegisteredProduct["unit"] })} className={fieldClass}><option value="un.">un.</option><option value="m²">m²</option><option value="balde">balde</option></select></label>
      <label className={labelClass}>Preço de venda<input inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={fieldClass} placeholder="Sob consulta" /></label>
      <label className={labelClass}>Custo *<input required inputMode="decimal" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} className={fieldClass} placeholder="0,00" /></label>
      <label className={labelClass}>Tamanho *<input required value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Acabamento *<input required value={form.finish} onChange={(event) => setForm({ ...form, finish: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>Cor *<input required value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className={fieldClass} /></label>
      <label className={labelClass}>{product ? "Estoque atual" : "Estoque inicial *"}<input required={!product} disabled={Boolean(product)} inputMode="numeric" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={`${fieldClass} disabled:bg-[#f3f4f5] disabled:text-[#88867e]`} /><span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-[#99968e]">{product ? "Alterações de saldo devem ser feitas no estoque." : "Quantidade disponível no cadastro inicial."}</span></label>
      <ActiveField active={form.active} onChange={(active) => setForm({ ...form, active })} />
      {error && <p role="alert" className="text-xs font-semibold text-[#b83c1d] sm:col-span-2">{error}</p>}
      <FormActions onClose={onClose} />
    </form>
  );
}

function ActiveField({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) {
  return (
    <label className={`${labelClass} flex items-center gap-3 sm:col-span-2`}>
      <input type="checkbox" checked={active} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#073f8c]" />
      Cadastro ativo
    </label>
  );
}

function FormActions({ onClose }: { onClose: () => void }) {
  return <div className="flex flex-col-reverse gap-2 border-t border-black/7 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-md border border-black/10 px-4 text-xs font-bold text-[#77756e]">CANCELAR</button><button type="submit" className="h-10 rounded-md bg-[#073f8c] px-5 text-xs font-bold text-white hover:bg-[#ed1c24]">SALVAR CADASTRO</button></div>;
}

export function RegistrationsView() {
  const customers = useStorageCollection<Customer>(CUSTOMERS_KEY, demoCustomers);
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const suppliers = useStorageCollection<Supplier>(SUPPLIERS_KEY, demoSuppliers);
  const stockEntries = useStorageCollection<StockEntry>(STOCK_KEY, []);
  const [tab, setTab] = useState<RegistrationTab>("customers");
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<EditingRecord>(null);
  const [feedback, setFeedback] = useState("");

  const term = normalize(search);
  const filteredCustomers = customers.filter((item) => !term || [item.name, item.document, item.phone, item.city].some((value) => normalize(value).includes(term)));
  const filteredProducts = products.filter((item) => !term || [item.name, item.sku, item.category, item.brand].some((value) => normalize(value).includes(term)));
  const filteredSuppliers = suppliers.filter((item) => !term || [item.name, item.contact, item.city, item.categories.join(" ")].some((value) => normalize(value).includes(term)));
  const records = tab === "customers" ? customers : tab === "products" ? products : suppliers;
  const activeCount = records.filter((record) => record.active).length;
  const title = tab === "customers" ? "Clientes" : tab === "products" ? "Produtos" : "Fornecedores";
  const singular = tab === "customers" ? "cliente" : tab === "products" ? "produto" : "fornecedor";
  const productValue = products.reduce((total, product) => total + effectiveStock(stockEntries, product).quantity * product.cost, 0);

  function changeTab(next: RegistrationTab) {
    setTab(next);
    setSearch("");
    setPanelOpen(false);
    setEditing(null);
    setFeedback("");
  }

  function openNew() {
    setEditing(null);
    setPanelOpen(true);
    setFeedback("");
  }

  function openEdit(record: EditingRecord) {
    setEditing(record);
    setPanelOpen(true);
    setFeedback("");
  }

  function saveCustomer(value: Customer, message: string) {
    writeStorage(CUSTOMERS_KEY, customers.some((item) => item.id === value.id) ? customers.map((item) => item.id === value.id ? value : item) : [value, ...customers]);
    finishSave(message);
  }

  function saveProduct(value: RegisteredProduct, message: string) {
    writeStorage(REGISTERED_PRODUCTS_KEY, products.some((item) => item.id === value.id) ? products.map((item) => item.id === value.id ? value : item) : [value, ...products]);
    finishSave(message);
  }

  function saveSupplier(value: Supplier, message: string) {
    writeStorage(SUPPLIERS_KEY, suppliers.some((item) => item.id === value.id) ? suppliers.map((item) => item.id === value.id ? value : item) : [value, ...suppliers]);
    finishSave(message);
  }

  function finishSave(message: string) {
    setPanelOpen(false);
    setEditing(null);
    setFeedback(message);
  }

  function toggleCustomer(customer: Customer) {
    writeStorage(CUSTOMERS_KEY, customers.map((item) => item.id === customer.id ? { ...item, active: !item.active } : item));
    setFeedback(`${customer.name} foi ${customer.active ? "desativado" : "ativado"}.`);
  }

  function toggleProduct(product: RegisteredProduct) {
    writeStorage(REGISTERED_PRODUCTS_KEY, products.map((item) => item.id === product.id ? { ...item, active: !item.active } : item));
    setFeedback(`${product.name} foi ${product.active ? "desativado" : "ativado"}.`);
  }

  function toggleSupplier(supplier: Supplier) {
    writeStorage(SUPPLIERS_KEY, suppliers.map((item) => item.id === supplier.id ? { ...item, active: !item.active } : item));
    setFeedback(`${supplier.name} foi ${supplier.active ? "desativado" : "ativado"}.`);
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-black/7 bg-white p-1" role="tablist" aria-label="Tipos de cadastro">
        {([ ["customers", Users, "Clientes"], ["products", Boxes, "Produtos"], ["suppliers", Building2, "Fornecedores"] ] as const).map(([value, Icon, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => changeTab(value)} className={`flex h-10 min-w-32 flex-1 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold transition-colors ${tab === value ? "bg-[#073f8c] text-white" : "text-[#77756e] hover:bg-[#f1f5f8]"}`}><Icon size={15} />{label}</button>)}
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label={`Resumo de ${title.toLowerCase()}`}>
        <SummaryCard label={`Total de ${title.toLowerCase()}`} value={String(records.length)} hint="cadastros preservados" icon={tab === "customers" ? Users : tab === "products" ? Boxes : Building2} tone="bg-[#e5edf7] text-[#315c88]" />
        <SummaryCard label="Cadastros ativos" value={String(activeCount)} hint="disponíveis para uso" icon={CheckCircle2} tone="bg-[#dce8dc] text-[#4f684f]" />
        <SummaryCard label="Cadastros inativos" value={String(records.length - activeCount)} hint="histórico mantido" icon={CircleOff} tone="bg-[#f1f1ef] text-[#77756e]" />
        <SummaryCard label={tab === "products" ? "Custo em estoque" : tab === "customers" ? "Cidades atendidas" : "Categorias fornecidas"} value={tab === "products" ? formatCurrency(productValue) : tab === "customers" ? String(new Set(customers.map((item) => normalize(item.city)).filter(Boolean)).size) : String(new Set(suppliers.flatMap((item) => item.categories.map(normalize))).size)} hint={tab === "products" ? "estoque × custo" : "variedade cadastrada"} icon={tab === "products" ? PackagePlus : tab === "customers" ? UserRound : Boxes} tone="bg-[#fff0e8] text-[#b83c1d]" />
      </section>

      {feedback && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#bfd5bf] bg-[#edf6ed] px-4 py-3 text-xs font-semibold text-[#4f684f]"><span className="flex items-center gap-2"><CheckCircle2 size={15} />{feedback}</span><button type="button" onClick={() => setFeedback("")} aria-label="Fechar mensagem"><X size={14} /></button></div>}

      <section className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-black/7 p-5 sm:flex-row sm:items-center">
          <div><h2 className="font-display text-xl">Cadastro de {title.toLowerCase()}</h2><p className="mt-1 text-[10px] text-[#88867e]">Edite dados ou desative registros sem perder o histórico</p></div>
          <div className="flex flex-col gap-2 xs:flex-row">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-black/10 px-3 sm:w-56"><Search size={15} className="shrink-0 text-[#89877e]" /><span className="sr-only">Buscar em {title.toLowerCase()}</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder={`Buscar ${singular}...`} /></label>
            <button type="button" onClick={openNew} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ed1c24] px-4 text-xs font-bold text-white hover:bg-[#bd1017]"><Plus size={15} /> NOVO {singular.toLocaleUpperCase("pt-BR")}</button>
          </div>
        </div>

        {tab === "customers" && <div className="divide-y divide-black/6">{filteredCustomers.length === 0 ? <EmptyState /> : filteredCustomers.map((customer) => <div key={customer.id} className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_.8fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-xs font-semibold">{customer.name}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{customer.id} · {customer.document || "Documento não informado"}</p></div><div className="min-w-0 text-[10px] text-[#77756e]"><p className="truncate">{customer.phone}</p><p className="mt-1 truncate">{customer.email || "E-mail não informado"}</p></div><div><p className="mb-1 text-[10px] text-[#77756e]">{customer.city || "Cidade não informada"}</p><StatusBadge active={customer.active} /></div><RowActions name={customer.name} active={customer.active} onEdit={() => openEdit(customer)} onToggle={() => toggleCustomer(customer)} /></div>)}</div>}

        {tab === "products" && <div className="divide-y divide-black/6">{filteredProducts.length === 0 ? <EmptyState /> : filteredProducts.map((product) => <div key={product.id} className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_.8fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-xs font-semibold">{product.name}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{product.sku} · {product.category} · {product.brand}</p></div><div><p className="text-xs font-semibold">{product.price === undefined ? "Sob consulta" : formatCurrency(product.price)}</p><p className="mt-1 text-[9px] text-[#99968e]">Custo {formatCurrency(product.cost)} / {product.unit}</p></div><div><p className="mb-1 text-[10px] text-[#77756e]">{effectiveStock(stockEntries, product).quantity} {product.unit} em estoque</p><StatusBadge active={product.active} /></div><RowActions name={product.name} active={product.active} onEdit={() => openEdit(product)} onToggle={() => toggleProduct(product)} /></div>)}</div>}

        {tab === "suppliers" && <div className="divide-y divide-black/6">{filteredSuppliers.length === 0 ? <EmptyState /> : filteredSuppliers.map((supplier) => <div key={supplier.id} className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_.8fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-xs font-semibold">{supplier.name}</p><p className="mt-1 truncate text-[10px] text-[#88867e]">{supplier.id} · {supplier.city || "Cidade não informada"}</p></div><div className="min-w-0 text-[10px] text-[#77756e]"><p className="truncate">{supplier.contact}</p><p className="mt-1 truncate">{supplier.email || "E-mail não informado"}</p></div><div><p className="mb-1 line-clamp-1 text-[10px] text-[#77756e]">{supplier.categories.join(", ") || "Sem categorias"}</p><StatusBadge active={supplier.active} /></div><RowActions name={supplier.name} active={supplier.active} onEdit={() => openEdit(supplier)} onToggle={() => toggleSupplier(supplier)} /></div>)}</div>}
      </section>

      {panelOpen && <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" aria-labelledby="registration-panel-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setPanelOpen(false); }}><aside className="h-full w-full overflow-y-auto bg-[#f8fafb] shadow-2xl sm:max-w-xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/8 bg-white px-5 py-4"><div><p className="text-[9px] font-bold tracking-wider text-[#ed1c24] uppercase">{editing ? "Editar cadastro" : "Novo cadastro"}</p><h2 id="registration-panel-title" className="font-display mt-1 text-2xl">{editing ? `Editar ${singular}` : `Cadastrar ${singular}`}</h2></div><button type="button" onClick={() => setPanelOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10" aria-label="Fechar painel"><X size={17} /></button></div><div className="p-5 sm:p-6">{tab === "customers" ? <CustomerForm key={(editing as Customer | null)?.id ?? "new-customer"} customer={editing as Customer | undefined} customers={customers} onSave={saveCustomer} onClose={() => setPanelOpen(false)} /> : tab === "products" ? <ProductForm key={(editing as RegisteredProduct | null)?.id ?? "new-product"} product={editing as RegisteredProduct | undefined} products={products} onSave={saveProduct} onClose={() => setPanelOpen(false)} /> : <SupplierForm key={(editing as Supplier | null)?.id ?? "new-supplier"} supplier={editing as Supplier | undefined} suppliers={suppliers} onSave={saveSupplier} onClose={() => setPanelOpen(false)} />}</div></aside></div>}
    </div>
  );
}

function RowActions({ name, active, onEdit, onToggle }: { name: string; active: boolean; onEdit: () => void; onToggle: () => void }) {
  return <div className="flex items-center justify-end gap-2"><button type="button" onClick={onEdit} className="grid h-9 w-9 place-items-center rounded-md border border-black/10 text-[#315c88] hover:border-[#073f8c]" aria-label={`Editar ${name}`}><Edit3 size={14} /></button><button type="button" onClick={onToggle} aria-pressed={!active} className={`h-9 rounded-md border px-3 text-[10px] font-bold ${active ? "border-black/10 text-[#77756e] hover:border-[#b83c1d] hover:text-[#b83c1d]" : "border-[#9fb99f] text-[#4f684f] hover:bg-[#edf6ed]"}`} aria-label={`${active ? "Desativar" : "Ativar"} ${name}`}>{active ? "DESATIVAR" : "ATIVAR"}</button></div>;
}

function EmptyState() {
  return <div className="grid place-items-center p-12 text-center"><Search size={27} className="text-[#c8c5bd]" /><p className="mt-3 text-sm font-semibold">Nenhum cadastro encontrado.</p><p className="mt-1 text-[10px] text-[#88867e]">Revise a busca ou crie um novo registro.</p></div>;
}
