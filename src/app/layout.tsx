import type { Metadata } from 'next';
import { Bebas_Neue, Montserrat, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['italic', 'normal'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'Train with Jaime',
  description: 'Entrenamiento y nutrición personalizados para estudiantes. Y tú, ¿quieres ganar?',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebas.variable} ${montserrat.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
