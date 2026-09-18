"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { useCart } from "@/components/cart-provider";
import { formatCurrency, products } from "@/data/products";
import { Quote, QUOTES_KEY, readStorage, writeStorage } from "@/lib/storage";

export default function QuotePage() {
  const { items, hydrated, updateItem, removeItem, clearCart } = useCart();
  const [sentId, setSentId] = useState<string | null>(null);
  const [form, setForm] = useState({ customer: "", phone: "", email: "", city: "", notes: "" });
  const detailedItems = items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId)! })).filter((item) => item.product);
  const total = detailedItems.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0);
  const hasUnpricedItems = detailedItems.some((item) => item.product.price === undefined);

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quotes = readStorage<Quote[]>(QUOTES_KEY, []);
    const id = `ORC-${1050 + quotes.length}`;
    const quote: Quote = { id, ...form, items, total, createdAt: new Date().toISOString(), status: "Novo" };
    writeStorage(QUOTES_KEY, [quote, ...quotes]);
    clearCart();
    setSentId(id);
  }

  if (!hydrated) return <SiteShell><div className="page-shell min-h-[60vh] py-20"><div className="h-7 w-52 animate-pulse bg-stone" /></div></SiteShell>;

  if (sentId) return (
    <SiteShell><section className="page-shell grid min-h-[70vh] place-items-center py-20 text-center"><div className="max-w-xl"><CheckCircle2 size={58} className="mx-auto text-clay" /><p className="eyebrow mt-7 text-clay">Solicitação {sentId}</p><h1 className="font-display mt-3 text-5xl">Seu projeto já chegou até nós.</h1><p className="mt-5 leading-7 text-muted">A solicitação foi salva neste navegador e já aparece no dashboard demonstrativo do ERP.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/erp" className="flex h-13 items-center justify-center bg-ink px-6 text-sm font-bold text-white">VER NO DASHBOARD</Link><Link href="/produtos" className="flex h-13 items-center justify-center border border-ink px-6 text-sm font-bold">VOLTAR AO CATÁLOGO</Link></div></div></section></SiteShell>
  );

  return (
    <SiteShell>
      <section className="border-b border-line bg-stone py-12 md:py-16"><div className="page-shell"><p className="eyebrow text-clay">Seu projeto</p><h1 className="font-display mt-3 text-5xl md:text-7xl">Pedido de orçamento</h1><p className="mt-4 text-sm text-muted">Revise os materiais e deixe seus dados. Preços e disponibilidade serão confirmados no atendimento.</p></div></section>
      {items.length === 0 ? (
        <section className="page-shell grid min-h-[480px] place-items-center py-16 text-center"><div><p className="font-display text-4xl">Sua seleção está vazia.</p><p className="mt-3 text-muted">Explore o catálogo e adicione os materiais que você gostou.</p><Link href="/produtos" className="mt-7 inline-flex h-13 items-center gap-2 bg-clay px-6 text-sm font-bold text-white"><ArrowLeft size={16} /> IR AO CATÁLOGO</Link></div></section>
      ) : (
        <section className="page-shell grid gap-12 py-12 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
          <div>
            <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl">Materiais selecionados</h2><span className="text-xs font-bold text-muted">{items.length} {items.length === 1 ? "ITEM" : "ITENS"}</span></div>
            <div className="border-t border-line">
              {detailedItems.map(({ product, quantity }) => (
                <article key={product.id} className="grid grid-cols-[86px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[110px_1fr_auto] sm:gap-6">
                  <Link href={`/produtos/${product.slug}`} className="relative aspect-square overflow-hidden bg-stone"><Image src={product.image} alt={product.name} fill sizes="110px" className="object-cover" /></Link>
                    <div><p className="text-[10px] font-bold tracking-wider text-muted uppercase">{product.brand} · {product.unit}</p><h3 className="font-display mt-1 text-xl">{product.name}</h3><p className="mt-2 text-sm font-semibold">{product.price !== undefined ? <>{product.pricePrefix} {formatCurrency(product.price)} <span className="font-normal text-muted">/ {product.unit}</span></> : <span className="text-clay">Preço sob consulta</span>}</p>{product.coverage && <p className="mt-1 text-xs text-muted">{Math.ceil(quantity / product.coverage)} caixas estimadas</p>}</div>
                  <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end">
                    <button onClick={() => removeItem(product.id)} className="text-muted hover:text-clay" aria-label={`Remover ${product.name}`}><Trash2 size={17} /></button>
                    <div className="flex h-10 items-center border border-line"><button onClick={() => updateItem(product.id, quantity - 1)} className="grid h-full w-9 place-items-center" aria-label="Diminuir"><Minus size={14} /></button><span className="min-w-12 text-center text-sm font-bold">{quantity}</span><button onClick={() => updateItem(product.id, quantity + 1)} className="grid h-full w-9 place-items-center" aria-label="Aumentar"><Plus size={14} /></button></div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex justify-between"><Link href="/produtos" className="flex items-center gap-2 text-xs font-bold"><ArrowLeft size={15} /> ADICIONAR PRODUTOS</Link><p className="text-right"><span className="block text-xs text-muted">{hasUnpricedItems ? "Subtotal dos itens com preço" : "Estimativa dos produtos"}</span><strong className="font-display text-2xl font-normal">{formatCurrency(total)}</strong>{hasUnpricedItems && <span className="block text-[10px] text-clay">+ itens sob consulta</span>}</p></div>
          </div>
          <form onSubmit={submitQuote} className="h-fit bg-stone p-6 sm:p-8">
            <p className="eyebrow text-clay">Quase pronto</p><h2 className="font-display mt-2 text-3xl">Como podemos falar com você?</h2>
            <div className="mt-7 grid gap-5"><label className="text-xs font-bold">NOME COMPLETO *<input required value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="Seu nome" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold">WHATSAPP *<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="(00) 00000-0000" /></label><label className="text-xs font-bold">CIDADE *<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="Sua cidade" /></label></div><label className="text-xs font-bold">E-MAIL<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="voce@email.com" /></label><label className="text-xs font-bold">OBSERVAÇÕES<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 min-h-24 w-full resize-none border border-line bg-paper p-4 text-sm outline-none focus:border-clay" placeholder="Prazo, entrega ou detalhes do projeto" /></label></div>
            <button className="mt-6 h-14 w-full bg-clay text-sm font-bold text-white transition-colors hover:bg-clay-dark">ENVIAR SOLICITAÇÃO</button>
            <a href={`https://wa.me/5511916639407?text=${encodeURIComponent(`Olá, Casa São José! Quero um orçamento com ${items.length} produto(s).${total > 0 ? ` Subtotal disponível: ${formatCurrency(total)}.` : ""}`)}`} target="_blank" rel="noreferrer" className="mt-3 flex h-13 items-center justify-center gap-2 border border-sage text-sm font-bold text-sage"><MessageCircle size={17} /> CONTINUAR NO WHATSAPP</a>
            <p className="mt-4 text-center text-[10px] leading-4 text-muted">Demonstração local: os dados não saem deste navegador.</p>
          </form>
        </section>
      )}
    </SiteShell>
  );
}
