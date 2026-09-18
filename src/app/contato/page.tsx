import { Clock3, Mail, MapPin, MessageCircle } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const metadata = { title: "Contato" };

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="bg-ink py-16 text-white md:py-24"><div className="page-shell"><p className="eyebrow text-[#ffd400]">Fale com a gente</p><h1 className="font-display mt-4 max-w-4xl text-5xl leading-none md:text-7xl">Toda boa escolha começa com uma conversa.</h1></div></section>
      <section className="page-shell grid gap-12 py-16 md:grid-cols-2 md:py-24">
        <div><h2 className="font-display text-4xl">Visite a Casa São José</h2><p className="mt-4 max-w-md leading-7 text-muted">Veja os produtos de perto e consulte as ofertas e condições disponíveis.</p><div className="mt-9 grid gap-6">{[[MapPin, "Endereço", "Av. 15 de Novembro, 25 · Itapecerica da Serra · SP"], [Clock3, "Horários", "Consulte o horário de atendimento pelo WhatsApp"], [MessageCircle, "WhatsApp", "(11) 91663-9407"], [Mail, "Instagram", "@casasaojoseacabamentos"]].map(([Icon, title, text]) => { const ContactIcon = Icon as typeof MapPin; return <div key={title as string} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone text-clay"><ContactIcon size={19} /></span><div><p className="text-xs font-bold uppercase tracking-wider">{title as string}</p><p className="mt-1 text-sm leading-6 text-muted">{text as string}</p></div></div>; })}</div><a href="https://wa.me/5511916639407" target="_blank" rel="noreferrer" className="mt-9 inline-flex h-13 items-center gap-3 bg-clay px-6 text-sm font-bold text-white"><MessageCircle size={18} /> CHAMAR NO WHATSAPP</a></div>
        <form className="bg-stone p-6 sm:p-10"><p className="eyebrow text-clay">Envie uma mensagem</p><div className="mt-7 grid gap-5"><label className="text-xs font-bold">NOME<input className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="Seu nome" /></label><label className="text-xs font-bold">TELEFONE<input className="mt-2 h-12 w-full border border-line bg-paper px-4 text-sm outline-none focus:border-clay" placeholder="(11) 00000-0000" /></label><label className="text-xs font-bold">COMO PODEMOS AJUDAR?<textarea className="mt-2 min-h-32 w-full resize-none border border-line bg-paper p-4 text-sm outline-none focus:border-clay" placeholder="Conte um pouco sobre seu projeto" /></label><button type="button" className="h-13 bg-clay text-sm font-bold text-white hover:bg-clay-dark">ENVIAR MENSAGEM</button><p className="text-center text-[11px] text-muted">Formulário demonstrativo. Nenhum dado será enviado.</p></div></form>
      </section>
    </SiteShell>
  );
}
