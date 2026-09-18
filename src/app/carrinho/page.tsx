"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { useShopCart } from "@/components/shop-cart-provider";
import { formatCurrency, products } from "@/data/products";

export default function ShoppingCartPage() {
  const { items, updateItem, removeItem } = useShopCart();
  const detailedItems = items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product?.price !== undefined);
  const subtotal = detailedItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);

  return (
    <SiteShell>
      <section className="border-b border-line bg-stone py-12 md:py-16"><div className="page-shell"><p className="eyebrow text-clay">Compra direta</p><h1 className="font-display mt-3 text-5xl md:text-7xl">Seu carrinho</h1><p className="mt-4 text-sm text-muted">Revise os produtos antes de escolher retirada, entrega e pagamento.</p></div></section>
      {detailedItems.length === 0 ? <section className="page-shell grid min-h-[480px] place-items-center py-16 text-center"><div><ShoppingCart size={52} className="mx-auto text-line" /><p className="font-display mt-6 text-4xl">Seu carrinho está vazio.</p><p className="mt-3 text-muted">Produtos com preço confirmado podem ser comprados diretamente.</p><Link href="/produtos" className="mt-7 inline-flex h-13 items-center gap-2 bg-clay px-6 text-sm font-bold text-white"><ArrowLeft size={16} /> VER PRODUTOS</Link></div></section> :
      <section className="page-shell grid gap-10 py-12 lg:grid-cols-[1.2fr_.8fr] lg:py-20">
        <div><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-3xl">Produtos</h2><span className="text-xs font-bold text-muted">{detailedItems.length} ITENS</span></div><div className="border-t border-line">{detailedItems.map(({ product, quantity }) => product && <article key={product.id} className="grid grid-cols-[92px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[120px_1fr_auto] sm:gap-6"><Link href={`/produtos/${product.slug}`} className="relative aspect-square overflow-hidden bg-stone"><Image src={product.image} alt={product.name} fill sizes="120px" className="object-cover" /></Link><div><p className="text-[10px] font-bold tracking-wider text-muted uppercase">{product.brand}</p><h3 className="font-display mt-1 text-xl">{product.name}</h3><p className="mt-2 text-sm font-semibold">{formatCurrency(product.price!)} <span className="font-normal text-muted">/ {product.unit}</span></p><p className="mt-1 text-xs text-muted">{product.size} · {product.finish}</p></div><div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end"><button onClick={() => removeItem(product.id)} aria-label={`Remover ${product.name}`} className="text-muted hover:text-clay"><Trash2 size={17} /></button><div className="flex h-10 items-center border border-line"><button onClick={() => updateItem(product.id, quantity - 1)} className="grid h-full w-9 place-items-center" aria-label="Diminuir"><Minus size={14} /></button><span className="min-w-12 text-center text-sm font-bold">{quantity}</span><button onClick={() => updateItem(product.id, quantity + 1)} className="grid h-full w-9 place-items-center" aria-label="Aumentar"><Plus size={14} /></button></div></div></article>)}</div><Link href="/produtos" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-ink"><ArrowLeft size={15} /> CONTINUAR COMPRANDO</Link></div>
        <aside className="h-fit bg-stone p-6 sm:p-8"><p className="eyebrow text-clay">Resumo</p><div className="mt-6 flex justify-between border-b border-line pb-5 text-sm"><span className="text-muted">Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="grid gap-4 border-b border-line py-5 text-xs text-muted"><p className="flex gap-3"><ShieldCheck size={17} className="shrink-0 text-sage" /> Pagamento demonstrativo e sem cobrança real.</p><p className="flex gap-3"><Truck size={17} className="shrink-0 text-sage" /> Retirada grátis ou entrega com taxa por região.</p></div><div className="flex items-end justify-between py-5"><span className="text-sm font-semibold">Total parcial</span><strong className="font-display text-3xl font-normal">{formatCurrency(subtotal)}</strong></div><Link href="/checkout" className="flex h-14 items-center justify-center bg-clay text-sm font-bold text-white hover:bg-clay-dark">IR PARA O CHECKOUT</Link><p className="mt-3 text-center text-[10px] text-muted">Frete calculado na próxima etapa.</p></aside>
      </section>}
    </SiteShell>
  );
}
