"use client";

import Link from "next/link";
import { Check, FileText, Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Product } from "@/data/products";
import { useShopCart } from "@/components/shop-cart-provider";

export function AddToQuote({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(product.unit === "m²" ? 10 : 1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { addItem: addToShopCart } = useShopCart();
  const router = useRouter();
  const step = product.unit === "m²" ? 1 : 1;

  function add() {
    addItem(product.id, quantity);
    setAdded(true);
  }

  function buy() {
    addToShopCart(product.id, quantity);
    router.push("/carrinho");
  }

  return (
    <div>
      <label className="eyebrow text-muted">Quantidade em {product.unit}</label>
      <div className="mt-3 flex h-14 w-full items-center justify-between border border-line px-2 sm:w-52">
        <button onClick={() => setQuantity(Math.max(step, quantity - step))} className="grid h-10 w-10 place-items-center" aria-label="Diminuir quantidade"><Minus size={17} /></button>
        <strong>{quantity} {product.unit}</strong>
        <button onClick={() => setQuantity(quantity + step)} className="grid h-10 w-10 place-items-center" aria-label="Aumentar quantidade"><Plus size={17} /></button>
      </div>
      {product.coverage && <p className="mt-2 text-xs text-muted">Estimativa: {Math.ceil(quantity / product.coverage)} caixas de {product.coverage.toFixed(2).replace(".", ",")} m²</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={add} className="flex h-14 w-full items-center justify-center gap-3 border border-ink px-5 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white">
          {added ? <><Check size={18} /> Adicionado</> : <><FileText size={18} /> Pedir orçamento</>}
        </button>
        {product.price !== undefined ? <button onClick={buy} className="flex h-14 w-full items-center justify-center gap-3 bg-clay px-5 text-sm font-bold text-white transition-colors hover:bg-clay-dark"><ShoppingCart size={18} /> Comprar agora</button> : <span className="flex h-14 items-center justify-center bg-stone px-5 text-center text-xs font-bold text-muted">COMPRA DIRETA INDISPONÍVEL</span>}
      </div>
      {added && <Link href="/orcamento" className="mt-3 block text-center text-sm font-semibold text-clay underline underline-offset-4">Ver meu orçamento</Link>}
    </div>
  );
}
