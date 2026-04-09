import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marmita Solidária — Obras do Templo',
  description: 'Reserva de refeições para apoio às obras do nosso templo de culto.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f0f7f7] text-[#1a3a3a] antialiased">
        {children}
      </body>
    </html>
  );
}
