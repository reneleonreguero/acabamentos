import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ShopCartProvider } from "@/components/shop-cart-provider";
import { StorageHydrator } from "@/components/storage-hydrator";

export const metadata: Metadata = {
  title: {
    default: "Casa São José Acabamentos | Itapecerica da Serra",
    template: "%s | Casa São José Acabamentos",
  },
  description: "Pisos, porcelanatos, gabinetes e acabamentos com preço baixo em Itapecerica da Serra.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full antialiased">
        <CartProvider><ShopCartProvider><StorageHydrator />{children}</ShopCartProvider></CartProvider>
      </body>
    </html>
  );
}
