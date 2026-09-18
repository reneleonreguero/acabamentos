import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Sobre nós" };

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="grid min-h-[620px] bg-stone lg:grid-cols-2">
        <div className="flex items-center px-5 py-16 sm:px-10 lg:px-[max(40px,calc((100vw-1240px)/2))] lg:pr-20"><div><p className="eyebrow text-clay">Casa São José Acabamentos</p><h1 className="font-display mt-5 text-5xl leading-[.98] md:text-7xl">Tudo para transformar o seu lar.</h1><p className="mt-7 max-w-xl leading-7 text-muted">Em Itapecerica da Serra, reunimos pisos, porcelanatos, gabinetes e soluções para quem está construindo ou reformando.</p></div></div>
        <div className="relative min-h-[450px]"><Image src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90" alt="Casa contemporânea com materiais naturais" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
      </section>
      <section className="page-shell grid gap-12 py-20 md:grid-cols-[.7fr_1.3fr] md:py-28"><div><p className="eyebrow text-clay">Nossa proposta</p></div><div><h2 className="font-display text-4xl leading-tight md:text-6xl">Variedade, qualidade e preço baixo para sua obra sair do papel.</h2><div className="mt-12 grid gap-8 border-t border-line pt-9 sm:grid-cols-3">{[["01", "Variedade", "Categorias para construir, reformar e finalizar."], ["02", "Economia", "Ofertas e opções que cabem no seu orçamento."], ["03", "Proximidade", "Loja física e atendimento direto pelo WhatsApp."]].map(([number, title, text]) => <div key={number}><span className="text-xs font-bold text-clay">{number}</span><h3 className="font-display mt-3 text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{text}</p></div>)}</div></div></section>
      <section className="bg-clay py-16 text-white"><div className="page-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><h2 className="font-display max-w-3xl text-4xl md:text-5xl">Vamos encontrar a base ideal para o seu projeto?</h2><Link href="/produtos" className="flex items-center gap-3 border-b border-white pb-2 text-sm font-bold">VER CATÁLOGO <ArrowRight size={17} /></Link></div></section>
    </SiteShell>
  );
}
