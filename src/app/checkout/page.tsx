"use client";

import Link from "next/link";
import { Check, CheckCircle2, CreditCard, Copy, Loader2, PackageCheck, QrCode, ShieldCheck, Store, Truck } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SiteShell } from "@/components/site-shell";
import { useShopCart } from "@/components/shop-cart-provider";
import { formatCurrency } from "@/data/products";
import { DELIVERIES_KEY, Delivery, demoDeliveries } from "@/lib/deliveries";
import { demoFinancialEntries, FINANCIAL_KEY, FinancialEntry } from "@/lib/finance";
import { Customer, CUSTOMERS_KEY, demoCustomers, demoProducts, REGISTERED_PRODUCTS_KEY, RegisteredProduct } from "@/lib/registrations";
import { effectiveStock, STOCK_KEY, STOCK_MOVEMENTS_KEY, StockEntry, StockMovement } from "@/lib/stock";
import { createId, Order, ORDERS_KEY, readStorage, writeStorage } from "@/lib/storage";
import { useStorageCollection } from "@/lib/use-storage-collection";

const regions = [
  { id: "centro", label: "Centro e proximidades", fee: 19.9 },
  { id: "itapecerica", label: "Itapecerica da Serra", fee: 29.9 },
  { id: "expandida", label: "Região expandida", fee: 49.9 },
];

export default function CheckoutPage() {
  const { items, clearCart } = useShopCart();
  const products = useStorageCollection<RegisteredProduct>(REGISTERED_PRODUCTS_KEY, demoProducts);
  const stockEntries = useStorageCollection<StockEntry>(STOCK_KEY, []);
  const stockMovements = useStorageCollection<StockMovement>(STOCK_MOVEMENTS_KEY, []);
  const customers = useStorageCollection<Customer>(CUSTOMERS_KEY, demoCustomers);
  const financialEntries = useStorageCollection<FinancialEntry>(FINANCIAL_KEY, demoFinancialEntries);
  const deliveries = useStorageCollection<Delivery>(DELIVERIES_KEY, demoDeliveries);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", document: "" });
  const [fulfillment, setFulfillment] = useState<"Retirada" | "Entrega">("Retirada");
  const [region, setRegion] = useState(regions[0].id);
  const [address, setAddress] = useState({ zip: "", street: "", number: "", complement: "", district: "", city: "Itapecerica da Serra" });
  const [paymentMethod, setPaymentMethod] = useState<"Cartão" | "Pix">("Pix");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "", installments: 1 });
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSecondsLeft, setPixSecondsLeft] = useState(600);
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const completionLock = useRef<string | null>(null);

  const digits = card.number.replace(/\D/g, "");
  const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : null;

  useEffect(() => {
    if (!pixGenerated) return;
    const timer = window.setInterval(() => setPixSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pixGenerated]);

  const detailedItems = items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product?.price !== undefined);
  const subtotal = detailedItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const selectedRegion = regions.find((item) => item.id === region)!;
  const deliveryFee = fulfillment === "Entrega" ? selectedRegion.fee : 0;
  const total = subtotal + deliveryFee;
  const installmentValue = total / card.installments;
  const fakePixCode = `00020126360014BR.GOV.BCB.PIX0114CASASAOJOSE${Math.round(total * 100)}52040000530398654${"5802BR5912Casa Sao Jose0203SAO62070503***6304A1B2"}`;

  function copyPixCode() {
    window.navigator.clipboard?.writeText(fakePixCode);
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 1600);
  }

  function completeOrder(id: string) {
    if (completedOrder || completionLock.current !== id) return;

    const currentProducts = readStorage<RegisteredProduct[]>(REGISTERED_PRODUCTS_KEY, products);
    const currentStock = readStorage<StockEntry[]>(STOCK_KEY, stockEntries);
    const unavailable = items.flatMap((item) => {
      const product = currentProducts.find((candidate) => candidate.id === item.productId);
      if (!product) return [`Produto ${item.productId} não está mais disponível.`];
      const available = effectiveStock(currentStock, product).quantity;
      return available < item.quantity ? [`Estoque insuficiente para ${product.name}: disponível ${available}, solicitado ${item.quantity}.`] : [];
    });
    if (unavailable.length > 0) {
      completionLock.current = null;
      setProcessing(false);
      setOrderError(unavailable.join(" "));
      return;
    }

    const orders = readStorage<Order[]>(ORDERS_KEY, []);
    const existingOrder = orders.find((order) => order.id === id);
    if (existingOrder) {
      setCompletedOrder(existingOrder);
      return;
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const normalizedEmail = customer.email.trim().toLowerCase();
    const normalizedPhone = customer.phone.replace(/\D/g, "");
    const currentCustomers = readStorage<Customer[]>(CUSTOMERS_KEY, customers);
    let savedCustomer = currentCustomers.find((item) => item.email.trim().toLowerCase() === normalizedEmail || item.phone.replace(/\D/g, "") === normalizedPhone);
    const fullAddress = fulfillment === "Entrega"
      ? `${address.street.trim()}, ${address.number.trim()}${address.complement.trim() ? ` - ${address.complement.trim()}` : ""} - ${address.district.trim()}, ${address.city.trim()} - CEP ${address.zip.trim()} (${selectedRegion.label})`
      : "";
    if (!savedCustomer) {
      savedCustomer = {
        id: createId("CLI"),
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        document: customer.document.trim(),
        city: fulfillment === "Entrega" ? address.city.trim() : "",
        address: fullAddress,
        notes: "Cliente criado pelo checkout.",
        active: true,
        createdAt,
      };
      writeStorage(CUSTOMERS_KEY, [savedCustomer, ...currentCustomers]);
    }

    const order: Order = {
      id,
      customerId: savedCustomer.id,
      customer,
      items,
      subtotal,
      deliveryFee,
      total,
      fulfillment,
      address: fulfillment === "Entrega" ? { ...address, region: selectedRegion.label } : undefined,
      payment: paymentMethod === "Pix" ? { method: "Pix" } : { method: "Cartão", installments: card.installments, brand: brand ?? "Cartão", last4: digits.slice(-4) },
      paymentStatus: "Pago (simulação)",
      orderStatus: "Aguardando separação",
      createdAt,
    };

    const nextStock = [...currentStock];
    const movements = readStorage<StockMovement[]>(STOCK_MOVEMENTS_KEY, stockMovements);
    const newMovements: StockMovement[] = items.map((item) => {
      const product = currentProducts.find((candidate) => candidate.id === item.productId)!;
      const current = effectiveStock(nextStock, product);
      const entry: StockEntry = { productId: item.productId, quantity: current.quantity - item.quantity, min: current.min };
      const index = nextStock.findIndex((saved) => saved.productId === item.productId);
      if (index >= 0) nextStock[index] = entry; else nextStock.push(entry);
      return { id: createId("MOV"), productId: item.productId, type: "Saída", quantity: item.quantity, reason: `Pedido ${id}`, createdAt, user: "Checkout online" };
    });

    const currentFinancial = readStorage<FinancialEntry[]>(FINANCIAL_KEY, financialEntries);
    const financialEntry: FinancialEntry = {
      id: createId("FIN"),
      kind: "Receber",
      description: `Pedido ${id}`,
      party: customer.name.trim(),
      category: "Vendas",
      amount: total,
      dueAt: createdAt.slice(0, 10),
      paidAt: createdAt.slice(0, 10),
      status: "Pago",
      sourceType: "Pedido",
      sourceId: id,
      createdAt,
    };

    writeStorage(ORDERS_KEY, [order, ...orders]);
    writeStorage(STOCK_KEY, nextStock);
    writeStorage(STOCK_MOVEMENTS_KEY, [...newMovements, ...movements]);
    if (!currentFinancial.some((entry) => entry.sourceType === "Pedido" && entry.sourceId === id)) writeStorage(FINANCIAL_KEY, [financialEntry, ...currentFinancial]);
    if (fulfillment === "Entrega") {
      const currentDeliveries = readStorage<Delivery[]>(DELIVERIES_KEY, deliveries);
      if (!currentDeliveries.some((delivery) => delivery.sourceType === "Pedido" && delivery.sourceId === id)) {
        const scheduled = new Date(now);
        scheduled.setDate(scheduled.getDate() + 1);
        const scheduledAt = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`;
        const delivery: Delivery = { id: createId("ENT"), sourceType: "Pedido", sourceId: id, customer: customer.name.trim(), phone: customer.phone.trim(), address: fullAddress, scheduledAt, window: "Comercial", assignee: "A definir", status: "A separar", notes: "", items, total, createdAt };
        writeStorage(DELIVERIES_KEY, [delivery, ...currentDeliveries]);
      }
    }
    clearCart();
    setCompletedOrder(order);
  }

  function processOrder() {
    if (processing || completedOrder || completionLock.current) return;
    setOrderError(null);
    setProcessing(true);
    const id = createId("PED");
    completionLock.current = id;
    window.setTimeout(() => completeOrder(id), 1600);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing || completedOrder) return;
    if (paymentMethod === "Pix") {
      setPixGenerated(true);
      setPixSecondsLeft(600);
      setPixCopied(false);
      return;
    }
    processOrder();
  }

  function simulateReceived() {
    processOrder();
  }

  if (completedOrder) return <SiteShell><section className="page-shell grid min-h-[72vh] place-items-center py-20 text-center"><div className="max-w-2xl"><CheckCircle2 size={64} className="mx-auto text-[#19a05a]" /><p className="eyebrow mt-7 text-clay">Pedido {completedOrder.id}</p><h1 className="font-display mt-3 text-5xl md:text-6xl">Compra simulada concluída.</h1><p className="mt-5 leading-7 text-muted">O pagamento foi aprovado apenas para demonstração. Seu pedido foi criado no ERP com status “Aguardando separação”.</p><div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 bg-stone p-5 text-left text-sm"><div><span className="text-xs text-muted">Recebimento</span><strong className="mt-1 block">{completedOrder.fulfillment}</strong></div><div><span className="text-xs text-muted">Total</span><strong className="mt-1 block">{formatCurrency(completedOrder.total)}</strong></div><div><span className="text-xs text-muted">Pagamento</span><strong className="mt-1 block">{completedOrder.payment.method}</strong></div><div><span className="text-xs text-muted">Status</span><strong className="mt-1 block text-[#19a05a]">Pago (simulação)</strong></div></div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/erp" className="flex h-13 items-center justify-center bg-ink px-6 text-sm font-bold text-white">VER PEDIDO NO ERP</Link><Link href="/produtos" className="flex h-13 items-center justify-center border border-ink px-6 text-sm font-bold">CONTINUAR COMPRANDO</Link></div></div></section></SiteShell>;

  if (detailedItems.length === 0) return <SiteShell><section className="page-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><p className="font-display text-4xl">Não há produtos no checkout.</p><Link href="/produtos" className="mt-6 inline-flex h-13 items-center bg-clay px-6 text-sm font-bold text-white">VER PRODUTOS</Link></div></section></SiteShell>;

  return <SiteShell>
    <section className="border-b border-line bg-ink py-10 text-white"><div className="page-shell"><p className="eyebrow text-[#ffd400]">Checkout demonstrativo</p><h1 className="font-display mt-2 text-4xl md:text-5xl">Finalizar compra</h1><div className="mt-6 flex max-w-xl items-center gap-2 text-[10px] font-bold uppercase"><span className="rounded-full bg-white px-3 py-1.5 text-ink">1. Dados</span><span className="h-px flex-1 bg-white/20" /><span className="rounded-full bg-white/10 px-3 py-1.5">2. Entrega</span><span className="h-px flex-1 bg-white/20" /><span className="rounded-full bg-white/10 px-3 py-1.5">3. Pagamento</span></div></div></section>
    <form onSubmit={submit} className="page-shell grid gap-8 py-10 lg:grid-cols-[1.2fr_.8fr] lg:py-16">
      <div className="space-y-6">
        <section className="border border-line bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">1</span><h2 className="font-display text-2xl">Seus dados</h2></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">NOME COMPLETO *<input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold">WHATSAPP *<input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" placeholder="(11) 00000-0000" /></label><label className="text-xs font-bold">E-MAIL *<input type="email" required value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold">CPF *<input required value={customer.document} onChange={(event) => setCustomer({ ...customer, document: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" placeholder="000.000.000-00" /></label></div></section>

        <section className="border border-line bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">2</span><h2 className="font-display text-2xl">Como você quer receber?</h2></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setFulfillment("Retirada")} className={`p-5 text-left transition-colors ${fulfillment === "Retirada" ? "border-2 border-ink bg-stone" : "border border-line"}`}><Store size={22} className="text-clay" /><strong className="mt-3 block">Retirar na loja</strong><span className="mt-1 block text-xs text-muted">Grátis · Av. 15 de Novembro, 25</span></button><button type="button" onClick={() => setFulfillment("Entrega")} className={`p-5 text-left transition-colors ${fulfillment === "Entrega" ? "border-2 border-ink bg-stone" : "border border-line"}`}><Truck size={22} className="text-clay" /><strong className="mt-3 block">Receber no endereço</strong><span className="mt-1 block text-xs text-muted">Taxa simulada conforme região</span></button></div>
        {fulfillment === "Retirada" ? <div className="mt-5 flex gap-3 bg-[#fff7d5] p-4 text-xs leading-5 text-[#705800]"><PackageCheck size={20} className="shrink-0" /><p><strong>Aguarde a separação.</strong><br />A retirada será liberada após a confirmação da loja.</p></div> : <div className="mt-6"><p className="text-xs font-bold">REGIÃO DE ENTREGA</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{regions.map((item) => <button key={item.id} type="button" onClick={() => setRegion(item.id)} className={`p-3 text-left text-xs ${region === item.id ? "border-2 border-clay bg-[#fff4f4]" : "border border-line"}`}><strong className="block">{item.label}</strong><span className="mt-1 block text-muted">{formatCurrency(item.fee)}</span></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">CEP *<input required value={address.zip} onChange={(event) => setAddress({ ...address, zip: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold">BAIRRO *<input required value={address.district} onChange={(event) => setAddress({ ...address, district: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold sm:col-span-2">ENDEREÇO *<input required value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold">NÚMERO *<input required value={address.number} onChange={(event) => setAddress({ ...address, number: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label><label className="text-xs font-bold">COMPLEMENTO<input value={address.complement} onChange={(event) => setAddress({ ...address, complement: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" /></label></div></div>}</section>

        <section className="border border-line bg-white p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">3</span><h2 className="font-display text-2xl">Pagamento</h2></div><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setPaymentMethod("Pix"); setPixGenerated(false); }} className={`flex h-13 items-center justify-center gap-2 text-sm font-bold ${paymentMethod === "Pix" ? "border-2 border-ink bg-stone" : "border border-line"}`}><QrCode size={18} /> Pix</button><button type="button" onClick={() => setPaymentMethod("Cartão")} className={`flex h-13 items-center justify-center gap-2 text-sm font-bold ${paymentMethod === "Cartão" ? "border-2 border-ink bg-stone" : "border border-line"}`}><CreditCard size={18} /> Cartão</button></div>
        {paymentMethod === "Cartão" ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold sm:col-span-2">NÚMERO DO CARTÃO *{brand && <span className="ml-2 rounded-full bg-[#e5edf7] px-2.5 py-1 text-[10px] font-bold text-sage">{brand}</span>}<input required inputMode="numeric" value={card.number} onChange={(event) => setCard({ ...card, number: event.target.value.replace(/[^0-9 ]/g, "").slice(0, 19) })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" placeholder="0000 0000 0000 0000" /></label><label className="text-xs font-bold sm:col-span-2">NOME NO CARTÃO *<input required value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} className="mt-2 h-12 w-full border border-line px-4 text-sm uppercase outline-none focus:border-clay" /></label><label className="text-xs font-bold">VALIDADE *<input required value={card.expiry} onChange={(event) => setCard({ ...card, expiry: event.target.value.slice(0, 5) })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" placeholder="MM/AA" /></label><label className="text-xs font-bold">CVV *<input required inputMode="numeric" value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })} className="mt-2 h-12 w-full border border-line px-4 text-sm outline-none focus:border-clay" placeholder="000" /></label><label className="text-xs font-bold sm:col-span-2">PARCELAMENTO<select value={card.installments} onChange={(event) => setCard({ ...card, installments: Number(event.target.value) })} className="mt-2 h-12 w-full border border-line bg-white px-4 text-sm outline-none focus:border-clay">{Array.from({ length: 6 }, (_, index) => index + 1).map((amount) => <option key={amount} value={amount}>{amount}x de {formatCurrency(total / amount)} sem juros</option>)}</select></label><div className="sm:col-span-2 flex gap-3 bg-stone p-4 text-xs text-muted"><ShieldCheck size={18} className="shrink-0 text-sage" /> Simulação: número completo e CVV não serão armazenados.</div></div> : pixGenerated ? <div className="mt-6 text-center"><div className="relative mx-auto w-fit border-8 border-white bg-white shadow-sm"><QRCodeSVG value={fakePixCode} size={210} level="M" /><span className="absolute inset-x-2 top-1/2 -translate-y-1/2 bg-clay py-1 text-[9px] font-black tracking-wider text-white">SIMULAÇÃO · NÃO PAGÁVEL</span></div><div className="mt-4 flex items-center justify-center gap-4 rounded-md bg-stone px-4 py-3 text-xs"><span><strong>Válido por</strong><br /><span className="font-display text-lg">{String(Math.floor(pixSecondsLeft / 60)).padStart(2, "0")}:{String(pixSecondsLeft % 60).padStart(2, "0")}</span></span><span className="h-8 w-px bg-line" /><span className="max-w-[46%] truncate font-mono text-[10px] text-muted">{fakePixCode}</span><button type="button" onClick={copyPixCode} className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-[10px] font-bold text-white">{pixCopied ? <Check size={12} /> : <Copy size={12} />}{pixCopied ? "COPIADO" : "COPIAR"}</button></div><p className="mt-3 text-xs text-muted">QR Code e código sem valor: só para demonstração do visual.</p><button type="button" onClick={simulateReceived} disabled={processing} className="mt-5 flex h-13 w-full items-center justify-center gap-2 bg-[#19a05a] text-sm font-bold text-white">{processing ? <><Loader2 size={18} className="animate-spin" /> PROCESSANDO PAGAMENTO...</> : <><Check size={18} /> SIMULAR PAGAMENTO RECEBIDO</>}</button></div> : <div className="mt-6 flex gap-3 bg-stone p-5 text-sm leading-6 text-muted"><QrCode size={24} className="shrink-0 text-sage" /><p>Ao continuar, será exibido um QR Code demonstrativo sem capacidade de receber pagamentos.</p></div>}</section>
      </div>

      <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-32"><h2 className="font-display text-2xl">Resumo do pedido</h2><div className="mt-5 space-y-3 border-b border-line pb-5">{detailedItems.map(({ product, quantity }) => product && <div key={product.id} className="flex justify-between gap-4 text-xs"><span className="text-muted">{quantity}× {product.name}</span><strong>{formatCurrency(product.price! * quantity)}</strong></div>)}</div><div className="space-y-3 border-b border-line py-5 text-sm"><div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span className="text-muted">{fulfillment}</span><span>{deliveryFee ? formatCurrency(deliveryFee) : "Grátis"}</span></div></div><div className="flex items-end justify-between py-5"><span className="font-semibold">Total</span><strong className="font-display text-3xl font-normal">{formatCurrency(total)}</strong></div>{paymentMethod === "Cartão" && <p className="mb-4 text-right text-xs text-muted">{card.installments}x de {formatCurrency(installmentValue)} sem juros</p>}{orderError && <p role="alert" className="mb-4 bg-[#fff4f4] p-3 text-xs leading-5 text-clay">{orderError}</p>}{!pixGenerated && <button disabled={processing} className="flex h-14 w-full items-center justify-center gap-2 bg-clay text-sm font-bold text-white hover:bg-clay-dark">{processing ? <><Loader2 size={18} className="animate-spin" /> PROCESSANDO...</> : paymentMethod === "Pix" ? "GERAR QR CODE PIX" : "SIMULAR PAGAMENTO"}</button>}<p className="mt-4 text-center text-[10px] leading-4 text-muted">Ambiente demonstrativo. Nenhuma cobrança será realizada.</p></aside>
    </form>
  </SiteShell>;
}
