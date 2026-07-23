import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Бункер 2077 — ИИ-Хроники Выживания',
  description: 'Постапокалиптическая Party-игра с ИИ-ботами и динамическими катастрофами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-400 min-h-screen">
        {children}
      </body>
    </html>
  );
}
