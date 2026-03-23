import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntApp, ConfigProvider } from 'antd';
import type { Metadata } from 'next';

import { Header } from '@/components/Header';

import { Providers } from './providers';

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
        <AntdRegistry>
          <ConfigProvider theme={{ token: { fontFamily: 'Inter, sans-serif' } }}>
            <AntApp>
              <Providers>
                <Header />
                <main className="main-content">{children}</main>
              </Providers>
            </AntApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
