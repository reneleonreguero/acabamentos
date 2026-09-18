"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { BrandLogo } from "@/components/brand-logo";
import { useShopCart } from "@/components/shop-cart-provider";

const links = [
  ["Início", "/"],
  ["Produtos", "/produtos"],
  ["Sobre", "/sobre"],
  ["Contato", "/contato"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const { count: shopCount } = useShopCart();

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-paper/95 backdrop-blur-xl">
      <div className="bg-ink text-white"><div className="page-shell flex h-8 items-center justify-center text-center text-[9px] font-bold tracking-[.12em] uppercase sm:justify-between"><span>Av. 15 de Novembro, 25 · Itapecerica da Serra</span><a href="https://wa.me/5511916639407" target="_blank" rel="noreferrer" className="hidden text-[#ffd400] sm:block">WhatsApp (11) 91663-9407</a></div></div>
      <div className="page-shell flex h-20 items-center justify-between">
        <Link href="/" aria-label="Casa São José Acabamentos, início">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={`text-sm transition-colors hover:text-clay ${pathname === href ? "font-semibold text-clay" : "text-ink/75"}`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/orcamento" className="relative hidden h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-clay hover:text-clay sm:grid" aria-label="Ver orçamento">
            <FileText size={18} />
            {hydrated && count > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">{count}</span>}
          </Link>
          <Link href="/carrinho" className="relative grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-clay hover:text-clay" aria-label="Ver carrinho de compras">
            <ShoppingCart size={19} />
            {shopCount > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ffd400] px-1 text-[10px] font-bold text-ink">{shopCount}</span>}
          </Link>
          <Link href="/orcamento" className="hidden rounded-full bg-ink px-5 py-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-clay lg:block">
            PEDIR ORÇAMENTO
          </Link>
          <button onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center md:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper px-5 py-4 md:hidden" aria-label="Navegação móvel">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-line/70 py-4 font-display text-2xl">
              {label}
            </Link>
          ))}
          <Link href="/orcamento" onClick={() => setOpen(false)} className="block border-b border-line/70 py-4 font-display text-2xl">Orçamento</Link>
          <Link href="/carrinho" onClick={() => setOpen(false)} className="block border-b border-line/70 py-4 font-display text-2xl">Carrinho {shopCount > 0 ? `(${shopCount})` : ""}</Link>
          <Link href="/erp" onClick={() => setOpen(false)} className="mt-4 block py-2 text-sm font-semibold text-clay">Acessar demonstração do ERP →</Link>
        </nav>
      )}
    </header>
  );
}
