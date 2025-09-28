import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <nav style={{ padding: '1rem 2rem', background: '#0f172a', color: '#fff' }}>
        <strong>AI Personal Trainer</strong>
      </nav>
      <main>{children}</main>
    </div>
  );
}
