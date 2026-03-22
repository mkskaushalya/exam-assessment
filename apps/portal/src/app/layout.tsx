import type { Metadata } from 'next';

import { Providers } from './providers';
import { Header } from '@/components/Header';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Exam Practice Platform',
  description: 'Practice exams, past papers, and AI-predicted questions for exam preparation',
  keywords: ['exam', 'practice', 'past papers', 'model papers', 'education'],
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
