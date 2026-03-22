import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntApp, ConfigProvider } from 'antd';
import '@ant-design/v5-patch-for-react-19';

import { AdminLayout } from '@/components/layout/AdminLayout';

export const metadata: Metadata = {
  title: 'Admin Panel — Exam Practice Platform',
  description: 'Admin panel for managing papers, questions, and users',
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
        <AntdRegistry>
          <ConfigProvider theme={{ token: { fontFamily: 'Inter, sans-serif' } }}>
            <AntApp>
              <AdminLayout>{children}</AdminLayout>
            </AntApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
