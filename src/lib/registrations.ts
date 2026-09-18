import { Product, products } from "@/data/products";

export const REGISTERED_PRODUCTS_KEY = "casa-sao-jose-products";
export const CUSTOMERS_KEY = "casa-sao-jose-customers";
export const SUPPLIERS_KEY = "casa-sao-jose-suppliers";

export type RegisteredProduct = Product & {
  sku: string;
  cost: number;
  active: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  city: string;
  address: string;
  notes: string;
  active: boolean;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  categories: string[];
  notes: string;
  active: boolean;
};

export const demoProducts: RegisteredProduct[] = products.map((product, index) => ({
  ...product,
  sku: `CSJ-${String(product.id).padStart(4, "0")}`,
  cost: Math.round((product.price ?? [55, 70, 48, 120][index % 4]) * 0.62 * 100) / 100,
  active: true,
}));

export const demoCustomers: Customer[] = [
  { id: "CLI-1001", name: "Marina Albuquerque", phone: "(11) 98821-4450", email: "marina@email.com", document: "***.482.***-20", city: "São Paulo/SP", address: "Rua das Flores, 180 - Centro", notes: "Prefere contato pelo WhatsApp.", active: true, createdAt: "2026-08-12T10:00:00" },
  { id: "CLI-1002", name: "Construtora Horizonte", phone: "(11) 97710-1234", email: "compras@horizonte.com", document: "12.345.678/0001-90", city: "Cotia/SP", address: "Av. Industrial, 850", notes: "Obras residenciais e comerciais.", active: true, createdAt: "2026-07-03T14:30:00" },
  { id: "CLI-1003", name: "Henrique Souza", phone: "(11) 96642-7741", email: "henrique@email.com", document: "***.915.***-04", city: "Embu das Artes/SP", address: "Rua Bela Vista, 42", notes: "", active: true, createdAt: "2026-09-02T09:20:00" },
  { id: "CLI-1004", name: "Paula Ribeiro", phone: "(11) 95518-3010", email: "paula@email.com", document: "***.126.***-71", city: "Itapecerica da Serra/SP", address: "Alameda Ipê, 76", notes: "Entrega no período da tarde.", active: true, createdAt: "2026-08-25T16:10:00" },
];

export const demoSuppliers: Supplier[] = [
  { id: "FOR-1001", name: "Embramaco Revestimentos", contact: "(11) 4002-8890", email: "pedidos@embramaco.com", city: "Mogi das Cruzes/SP", categories: ["Pisos", "Porcelanatos"], notes: "Prazo médio de 7 dias.", active: true },
  { id: "FOR-1002", name: "Porcelanato Premium Distribuidora", contact: "(11) 4224-1170", email: "vendas@premium.com", city: "Itapecerica da Serra/SP", categories: ["Pisos", "Revestimentos"], notes: "", active: true },
  { id: "FOR-1003", name: "Casa São José Indústria", contact: "(11) 4667-2020", email: "comercial@csjindustria.com", city: "Embu das Artes/SP", categories: ["Portas", "Madeiras"], notes: "", active: true },
  { id: "FOR-1004", name: "Votorantim Quartzolit", contact: "(11) 3003-7744", email: "distribuicao@quartzolit.com", city: "São Paulo/SP", categories: ["Impermeabilização", "Argamassas"], notes: "Pedido mínimo de R$ 1.500.", active: true },
  { id: "FOR-1005", name: "Fênix Ferragens e Acabamentos", contact: "(11) 4555-9090", email: "contato@fenix.com", city: "Cotia/SP", categories: ["Ferragens", "Portas"], notes: "", active: true },
];
