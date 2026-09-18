import { assetPath } from "@/lib/asset";

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  brand: string;
  price?: number;
  pricePrefix?: string;
  unit: "m²" | "un." | "balde";
  image: string;
  environmentImage?: string;
  size: string;
  finish: string;
  color: string;
  coverage?: number;
  stock: number;
  featured?: boolean;
  tag?: string;
  paymentTerms?: string;
  description: string;
};

export const products: Product[] = [
  {
    id: 1,
    slug: "piso-onix-blue-75x75",
    name: "Piso Onix Blue",
    category: "Pisos",
    brand: "Marca sob consulta",
    price: 49.9,
    unit: "m²",
    image: assetPath("/products/onix-blue.webp"),
    environmentImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88",
    size: "75 × 75 cm",
    finish: "Polido e retificado",
    color: "Azul acinzentado com veios brancos e marrons",
    stock: 38,
    featured: true,
    tag: "Destaque",
    description: "Superfície de efeito ônix em azul acinzentado, com veios claros e detalhes em tons quentes. A foto principal mostra a peça real exposta na loja.",
  },
  {
    id: 2,
    slug: "piso-sao-tome-76x76-embramaco",
    name: "Piso São Tomé",
    category: "Pisos",
    brand: "Embramaco",
    price: 39.9,
    unit: "m²",
    image: assetPath("/products/sao-tome.webp"),
    environmentImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=88",
    size: "76 × 76 cm",
    finish: "Antiderrapante e retificado",
    color: "Bege, areia e terracota",
    stock: 62,
    featured: true,
    tag: "Área externa",
    description: "Paginação inspirada em pedras naturais, com variações de bege e terracota. Acabamento antiderrapante indicado para projetos que pedem mais aderência.",
  },
  {
    id: 3,
    slug: "piso-onix-pink-75x75",
    name: "Piso Onix Pink",
    category: "Pisos",
    brand: "Marca sob consulta",
    price: 49.9,
    unit: "m²",
    image: assetPath("/products/onix-pink.webp"),
    environmentImage: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1400&q=88",
    size: "75 × 75 cm",
    finish: "Polido",
    color: "Rosa claro e bege com veios brancos",
    stock: 24,
    featured: true,
    tag: "Tendência",
    description: "Efeito ônix em tons suaves de rosa e bege, com transparências e veios claros para ambientes luminosos e marcantes.",
  },
  {
    id: 4,
    slug: "piso-victoria-70x70",
    name: "Piso Victoria",
    category: "Pisos",
    brand: "Marca sob consulta",
    price: 49.9,
    unit: "m²",
    image: assetPath("/products/victoria.webp"),
    environmentImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=88",
    size: "70 × 70 cm",
    finish: "Polido",
    color: "Preto com veios brancos e avermelhados",
    stock: 17,
    featured: true,
    tag: "Alto contraste",
    description: "Marmorizado preto de grande presença, atravessado por veios claros e pontos avermelhados. Ideal para detalhes e ambientes de contraste.",
  },
  {
    id: 5,
    slug: "piso-damasco-82x82",
    name: "Piso Damasco",
    category: "Pisos",
    brand: "Marca sob consulta",
    unit: "m²",
    image: assetPath("/products/damasco.webp"),
    environmentImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=88",
    size: "82 × 82 cm",
    finish: "Polido",
    color: "Branco e cinza com veios dourados e pretos",
    stock: 21,
    tag: "Preço sob consulta",
    description: "Marmorizado expressivo em base clara, com desenho dourado e pontos pretos. O preço da etiqueta não está legível na publicação e deve ser confirmado.",
  },
  {
    id: 6,
    slug: "piso-palermo-75x75",
    name: "Piso Palermo",
    category: "Pisos",
    brand: "Marca sob consulta",
    price: 51.9,
    unit: "m²",
    image: assetPath("/products/palermo.webp"),
    environmentImage: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1400&q=88",
    size: "75 × 75 cm",
    finish: "Polido",
    color: "Branco gelo com veios cinza",
    stock: 31,
    description: "Superfície clara com efeito translúcido e veios cinza, fácil de combinar com madeira, metais e tons neutros.",
  },
  {
    id: 7,
    slug: "porta-interna-completa",
    name: "Porta interna completa",
    category: "Portas",
    brand: "Casa São José",
    price: 179,
    unit: "un.",
    image: assetPath("/products/porta-completa.webp"),
    size: "Medida sob consulta",
    finish: "Madeira clara",
    color: "Amadeirado natural",
    stock: 12,
    tag: "Pronta entrega",
    paymentTerms: "À vista no Pix ou dinheiro",
    description: "Conjunto de porta interna com batente e fechadura, divulgado pela loja como produto à pronta entrega.",
  },
  {
    id: 8,
    slug: "manta-liquida-quartzolit",
    name: "Manta líquida Quartzolit",
    category: "Impermeabilização",
    brand: "Quartzolit",
    price: 199,
    unit: "balde",
    image: assetPath("/products/manta-quartzolit.webp"),
    size: "Embalagem sob consulta",
    finish: "Membrana acrílica branca",
    color: "Branca",
    stock: 7,
    tag: "Poucas unidades",
    paymentTerms: "À vista no Pix ou dinheiro, com retirada na loja",
    description: "Manta líquida branca para impermeabilização de lajes e telhados, conforme o anúncio publicado pela loja.",
  },
];

export const categories = ["Todos", ...new Set(products.map((product) => product.category))];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
