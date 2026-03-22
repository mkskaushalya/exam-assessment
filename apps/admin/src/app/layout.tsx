import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel — Exam Practice Platform',
  description: 'Admin panel for managing papers, questions, and users',
  icons: { icon: 'data:,' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}


