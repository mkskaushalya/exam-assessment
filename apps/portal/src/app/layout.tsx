import type { Metadata } from 'next';

import { Providers } from './providers';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Exam Practice Platform',
  description: 'Practice exams, past papers, and AI-predicted questions for exam preparation',
  keywords: ['exam', 'practice', 'past papers', 'model papers', 'education'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
