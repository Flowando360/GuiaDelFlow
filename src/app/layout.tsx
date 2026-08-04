import type { Metadata } from 'next';
import { Nunito, Playfair_Display } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Guía del Flow · FlowAndo',
  description: 'Descubre quién eres realmente — El Lab del Talento',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${nunito.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-flow-bg text-flow-text font-sans">{children}</body>
    </html>
  );
}
