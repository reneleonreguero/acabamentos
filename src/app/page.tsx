import Image from "next/image";
import { assetPath } from "@/lib/asset";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CreditCard, Grid2X2, Headphones, PaintBucket, Store, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { products } from "@/data/products";

export default function Home() {
  return (
    <SiteShell>
      <section className="relative min-h-[690px] overflow-hidden bg-[#d9d3c7] md:min-h-[760px]">
        <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90" alt="Ambiente contemporâneo com porcelanato claro" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#073f8c]/95 via-[#073f8c]/58 to-transparent" />
        <div className="page-shell relative flex min-h-[690px] items-end pb-16 text-white md:min-h-[760px] md:items-center md:pb-0">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 text-[#ffd400]">Qualidade com preço baixo</p>
            <h1 className="font-display text-[3.4rem] leading-[.95] font-normal tracking-[-.035em] sm:text-7xl md:text-[6rem]">Sua casa, do piso ao acabamento.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 md:text-lg">Pisos, porcelanatos, gabinetes e tudo o que você precisa para construir ou renovar em Itapecerica da Serra.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/produtos" className="flex h-14 items-center justify-center gap-3 bg-clay px-7 text-sm font-bold transition-colors hover:bg-clay-dark">EXPLORAR CATÁLOGO <ArrowRight size={17} /></Link>
              <Link href="/orcamento" className="flex h-14 items-center justify-center border border-white/50 px-7 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white hover:text-ink">PEDIR ORÇAMENTO</Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 hidden bg-paper px-9 py-7 text-ink lg:block">
          <p className="eyebrow text-clay">Ofertas do Instagram</p><p className="mt-2 font-display text-xl">Pisos a partir de R$ 29,90/m²*</p><p className="mt-1 text-[9px] text-muted">Consulte modelos, validade e estoque.</p>
        </div>
      </section>

      <section className="border-b border-line bg-paper">
        <div className="page-shell grid grid-cols-2 md:grid-cols-4">
          {[
            [BadgeDollarSign, "Preço baixo", "Ofertas para sua obra"],
            [Grid2X2, "Muita variedade", "Pisos e porcelanatos"],
            [PaintBucket, "Acabamento completo", "Tintas e impermeabilização"],
            [Headphones, "Atendimento fácil", "Direto pelo WhatsApp"],
          ].map(([Icon, title, text], index) => {
            const FeatureIcon = Icon as typeof BadgeDollarSign;
            return <div key={title as string} className={`flex gap-3 px-2 py-7 md:px-7 ${index % 2 ? "border-l border-line" : ""} ${index > 1 ? "border-t border-line md:border-t-0 md:border-l" : ""}`}><FeatureIcon size={20} className="shrink-0 text-clay" /><div><p className="text-sm font-bold">{title as string}</p><p className="mt-1 text-xs text-muted">{text as string}</p></div></div>;
          })}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="page-shell">
          <div className="flex items-end justify-between gap-6">
             <div><p className="eyebrow text-clay">Compre direto no site</p><h2 className="font-display mt-3 text-4xl md:text-6xl">Pisos em destaque</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Escolha o produto, simule o pagamento e decida entre retirada na loja ou entrega.</p></div>
            <Link href="/produtos" className="hidden items-center gap-2 border-b border-ink pb-1 text-sm font-bold md:flex">VER TODOS <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.filter((product) => product.featured).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <Link href="/produtos" className="mt-10 flex h-13 items-center justify-center border border-ink text-sm font-bold md:hidden">VER CATÁLOGO COMPLETO</Link>
        </div>
      </section>

      <section className="border-t border-line bg-[#fff6d2] py-16 md:py-20">
        <div className="page-shell">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-clay">Compre online e retire na loja</p>
              <h2 className="font-display mt-3 max-w-2xl text-4xl md:text-6xl">Retirada grátis ou entrega perto de você.</h2>
            </div>
            <Link href="/carrinho" className="flex h-13 shrink-0 items-center gap-3 bg-clay px-6 text-sm font-bold text-white hover:bg-clay-dark">COMPRAR AGORA <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [Store, "Retirada na loja", "Grátis · Av. 15 de Novembro, 25, Itapecerica da Serra"],
              [Truck, "Entrega por região", "Taxa simulada a partir de R$ 19,90 conforme a região"],
              [CreditCard, "Pix ou cartão até 6x", "Pagamento 100% demonstrativo, sem cobrança real"],
            ].map(([Icon, title, text]) => { const FeatureIcon = Icon as typeof Store; return <div key={title as string} className="flex gap-4 bg-white p-6"><FeatureIcon size={20} className="shrink-0 text-clay" /><div><p className="text-sm font-bold">{title as string}</p><p className="mt-1.5 text-xs leading-5 text-muted">{text as string}</p></div></div>; })}
          </div>
        </div>
      </section>

      <section className="bg-stone py-20 md:py-28">
        <div className="page-shell grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="relative aspect-[4/5] md:aspect-[5/6]">
            <Image src={assetPath("/products/mostruario.webp")} alt="Mostruário real de pisos da Casa São José" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            <div className="absolute -right-3 -bottom-4 w-44 bg-[#ffd400] p-5 text-ink md:-right-8 md:w-52 md:p-7"><strong className="font-display text-4xl font-normal">Na loja</strong><p className="mt-2 text-xs leading-5 text-ink/70">veja de perto as cores, texturas e acabamentos.</p></div>
          </div>
          <div>
            <p className="eyebrow text-clay">Casa São José Acabamentos</p>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] md:text-6xl">Mais opções para transformar seu lar.</h2>
            <p className="mt-6 max-w-lg leading-7 text-muted">Além de pisos e porcelanatos, você encontra gabinetes, portas, argamassas, iluminação, tintas, massa corrida e manta líquida.</p>
            <div className="mt-8 grid gap-6 border-t border-line pt-8 sm:grid-cols-2"><div><strong className="font-display text-2xl font-normal">Para construir</strong><p className="mt-2 text-sm leading-6 text-muted">Materiais essenciais para cada etapa da sua obra.</p></div><div><strong className="font-display text-2xl font-normal">Para renovar</strong><p className="mt-2 text-sm leading-6 text-muted">Soluções para mudar os ambientes sem complicação.</p></div></div>
            <Link href="/contato" className="mt-9 inline-flex items-center gap-3 text-sm font-bold text-clay">COMO CHEGAR <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
        <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full border border-white/5" /><div className="absolute -top-16 -right-5 h-64 w-64 rounded-full border border-white/5" />
        <div className="page-shell relative flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-3xl"><p className="eyebrow text-[#ffd400]">Fale com a Casa São José</p><h2 className="font-display mt-4 text-5xl leading-none md:text-7xl">Sua reforma começa com boas escolhas e preço justo.</h2></div>
          <Link href="/orcamento" className="flex h-15 shrink-0 items-center gap-3 bg-clay px-7 text-sm font-bold hover:bg-clay-dark">MONTAR ORÇAMENTO <ArrowRight size={17} /></Link>
        </div>
      </section>
    </SiteShell>
  );
}
