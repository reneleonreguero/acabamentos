import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Box, Calculator, ShieldCheck, Truck } from "lucide-react";
import { AddToQuote } from "@/components/add-to-quote";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { formatCurrency, getProduct, products } from "@/data/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product?.name ?? "Produto" };
}

export default async function ProductPage({ params }: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const fallbackRelated = related.length >= 3 ? related : products.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <SiteShell>
      <div className="page-shell py-5 md:py-8"><Link href="/produtos" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-clay"><ArrowLeft size={15} /> VOLTAR AO CATÁLOGO</Link></div>
      <section className="page-shell grid gap-8 pb-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-stone md:aspect-square lg:aspect-[4/5]"><Image src={product.image} alt={`Cor e textura real do ${product.name}`} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />{product.tag && <span className="absolute top-4 left-4 bg-paper px-4 py-2 text-[10px] font-bold tracking-wider uppercase">{product.tag}</span>}<span className="absolute right-4 bottom-4 bg-ink px-3 py-2 text-[9px] font-bold tracking-wider text-white uppercase">Superfície real · Mostruário da loja</span></div>
          {product.environmentImage && <div className="mt-4"><div className="relative aspect-[16/10] overflow-hidden bg-stone"><Image src={product.environmentImage} alt={`Referência de ambiente para ${product.name}`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" /></div><p className="mt-2 text-[10px] font-semibold tracking-wide text-muted uppercase">Imagem de referência em ambiente · Consulte a paginação final</p></div>}
        </div>
        <div className="lg:pt-7">
          <p className="eyebrow text-clay">{product.brand} · {product.category}</p>
          <h1 className="font-display mt-4 text-4xl leading-none md:text-6xl">{product.name}</h1>
          <p className="mt-6 text-base leading-7 text-muted">{product.description}</p>
          <div className="mt-8 border-y border-line py-5">{product.price !== undefined ? <><span className="mr-2 text-sm text-muted">{product.pricePrefix}</span><strong className="font-display text-3xl font-normal">{formatCurrency(product.price)}</strong><span className="text-sm text-muted"> / {product.unit}</span><p className="mt-1 text-[10px] text-muted">Preço divulgado pela loja. Confirme validade e estoque.</p></> : <strong className="font-display text-3xl font-normal text-clay">Preço sob consulta</strong>}{product.paymentTerms && <p className="mt-2 text-xs font-semibold text-sage">{product.paymentTerms}</p>}</div>
          <dl className="grid grid-cols-2 gap-y-5 py-7 text-sm"><div><dt className="text-xs text-muted">Formato</dt><dd className="mt-1 font-semibold">{product.size}</dd></div><div><dt className="text-xs text-muted">Acabamento</dt><dd className="mt-1 font-semibold">{product.finish}</dd></div><div><dt className="text-xs text-muted">Cor e desenho</dt><dd className="mt-1 font-semibold">{product.color}</dd></div><div><dt className="text-xs text-muted">Disponibilidade</dt><dd className="mt-1 font-semibold text-sage">Consulte a loja</dd></div></dl>
          <AddToQuote product={product} />
          <div className="mt-7 grid grid-cols-3 border-t border-line pt-6 text-center text-[10px] font-bold text-muted uppercase"><span className="flex flex-col items-center gap-2"><Calculator size={19} className="text-clay" />Peça orçamento</span><span className="flex flex-col items-center gap-2"><Truck size={19} className="text-clay" />Consulte entrega</span><span className="flex flex-col items-center gap-2"><ShieldCheck size={19} className="text-clay" />Compre na loja</span></div>
        </div>
      </section>
      <section className="bg-stone py-16 md:py-20"><div className="page-shell"><div className="mb-9 flex items-end justify-between"><div><p className="eyebrow text-clay">Complete o projeto</p><h2 className="font-display mt-2 text-4xl">Você também pode gostar</h2></div><Box className="hidden text-muted md:block" /></div><div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{fallbackRelated.map((item) => <ProductCard key={item.id} product={item} />)}</div></div></section>
    </SiteShell>
  );
}
