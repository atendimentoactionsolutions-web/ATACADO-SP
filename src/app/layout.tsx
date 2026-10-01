import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ATACADO SP | Especialista Apple - Catálogo Oficial",
  description: "Catálogo e consulta de preços oficiais de produtos Apple: iPhone, iPad, Mac, Apple Watch e Acessórios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-[#f4f5f7] text-[#1d1d1f] antialiased`}>
        {children}
      </body>
    </html>
  );
}
