import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel — Exam Practice Platform',
  description: 'Admin panel for managing papers, questions, and users',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
