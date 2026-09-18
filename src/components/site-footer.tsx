import Link from "next/link";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <BrandLogo inverse />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">Acabamentos que transformam seu lar, com variedade, qualidade e preço baixo.</p>
          <p className="mt-8 text-[10px] font-bold tracking-[.18em] text-white/40 uppercase">Produtos publicados pela loja · Confirme preços e estoque</p>
        </div>
        <div>
          <p className="eyebrow mb-4 text-white/40">Navegue</p>
          <div className="grid gap-3 text-sm text-white/70">
            <Link href="/produtos">Catálogo</Link><Link href="/sobre">Nossa história</Link><Link href="/orcamento">Meu orçamento</Link><Link href="/erp">ERP demonstrativo</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4 text-white/40">Visite a loja</p>
          <p className="flex gap-3 text-sm leading-6 text-white/70"><MapPin size={18} className="mt-1 shrink-0" /> Av. 15 de Novembro, 25<br />Itapecerica da Serra · SP</p>
          <div className="mt-5 flex gap-3">
            <a href="https://wa.me/5511916639407" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full border border-white/15"><MessageCircle size={16} /></a>
            <a href="https://www.instagram.com/casasaojoseacabamentos/" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full border border-white/15"><Camera size={16} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/35">© 2026 Casa São José Acabamentos. Protótipo para visualização.</div>
    </footer>
  );
}
