"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, FileText, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Product, formatCurrency } from "@/data/products";
import { useCart } from "@/components/cart-provider";
import { useShopCart } from "@/components/shop-cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { addItem: addToShopCart } = useShopCart();
  const [added, setAdded] = useState<"quote" | "cart" | null>(null);

  function handleQuote() {
    addItem(product.id);
    setAdded("quote");
    window.setTimeout(() => setAdded(null), 1300);
  }

  function handleBuy() {
    addToShopCart(product.id);
    setAdded("cart");
    window.setTimeout(() => setAdded(null), 1300);
  }

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        <Link href={`/produtos/${product.slug}`} aria-label={`Ver ${product.name}`}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 300px" className="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
        </Link>
        {product.tag && <span className="absolute top-3 left-3 bg-paper px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase">{product.tag}</span>}
        <span className="absolute bottom-3 left-3 bg-ink/90 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-white uppercase">Foto real</span>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[.15em] text-muted uppercase">{product.brand} · {product.category}</p>
            <Link href={`/produtos/${product.slug}`} className="mt-1.5 block font-display text-xl leading-tight transition-colors hover:text-clay">{product.name}</Link>
            <p className="mt-1.5 text-xs leading-5 text-muted">{product.color}</p>
          </div>
          <ArrowUpRight size={17} className="mt-1 shrink-0 text-muted" />
        </div>
        <p className="mt-3 text-sm">
          {product.price !== undefined ? <><span className="mr-1 text-xs text-muted">{product.pricePrefix}</span><strong>{formatCurrency(product.price)}</strong><span className="text-muted"> / {product.unit}</span></> : <strong className="text-clay">Preço sob consulta</strong>}
        </p>
        {product.paymentTerms && <p className="mt-1 text-[10px] font-semibold text-sage">{product.paymentTerms}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={handleQuote} className="flex h-10 items-center justify-center gap-2 border border-ink text-[10px] font-bold text-ink transition-colors hover:bg-ink hover:text-white">
            {added === "quote" ? <Check size={14} /> : <FileText size={14} />} {added === "quote" ? "ADICIONADO" : "ORÇAR"}
          </button>
          {product.price !== undefined ? <button onClick={handleBuy} className="flex h-10 items-center justify-center gap-2 bg-clay text-[10px] font-bold text-white transition-colors hover:bg-clay-dark">
            {added === "cart" ? <Check size={14} /> : <ShoppingCart size={14} />} {added === "cart" ? "NO CARRINHO" : "COMPRAR"}
          </button> : <span className="flex h-10 items-center justify-center bg-stone px-2 text-center text-[9px] font-bold text-muted">SOB CONSULTA</span>}
        </div>
      </div>
    </article>
  );
}
