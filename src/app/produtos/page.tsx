"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { categories, products } from "@/data/products";

export default function ProductsPage() {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filtered = products.filter((product) => (category === "Todos" || product.category === category) && product.name.toLowerCase().includes(deferredQuery.toLowerCase()));

  return (
    <SiteShell>
      <section className="border-b border-line bg-stone py-14 md:py-20">
        <div className="page-shell"><p className="eyebrow text-clay">Casa São José Acabamentos</p><div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end"><h1 className="font-display text-5xl md:text-7xl">Tudo para sua obra</h1><p className="max-w-md text-sm leading-6 text-muted">Categorias divulgadas pela loja para construir, reformar e transformar sua casa.</p></div></div>
      </section>
      <section className="py-8 md:py-12">
        <div className="page-shell">
          <div className="flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-center md:justify-between">
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-colors ${category === item ? "bg-ink text-white" : "border border-line hover:border-ink"}`}>{item}</button>)}
            </div>
            <label className="flex h-11 min-w-64 items-center gap-3 border-b border-ink px-1"><Search size={17} className="text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto" className="w-full bg-transparent text-sm outline-none" /></label>
          </div>
          <div className="my-7 flex items-center justify-between text-xs text-muted"><span>{filtered.length} produtos encontrados</span><span className="flex items-center gap-2"><SlidersHorizontal size={15} /> Preços sujeitos à confirmação</span></div>
          {filtered.length > 0 ? <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="py-24 text-center"><p className="font-display text-3xl">Nenhum produto encontrado.</p><button onClick={() => { setQuery(""); setCategory("Todos"); }} className="mt-4 text-sm font-bold text-clay">LIMPAR FILTROS</button></div>}
        </div>
      </section>
    </SiteShell>
  );
}
