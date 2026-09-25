import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Montserrat, Cormorant_Garamond } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/notifications/ServiceWorkerRegister';
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Train with Jaime',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#081A33',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebas.variable} ${montserrat.variable} ${cormorant.variable}`}>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
