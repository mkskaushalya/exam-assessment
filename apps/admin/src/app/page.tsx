'use client';

const stats = [
  { label: 'Total Papers', value: '—', icon: '📄' },
  { label: 'Total Questions', value: '—', icon: '❓' },
  { label: 'Registered Users', value: '—', icon: '👥' },
  { label: 'Active Sessions', value: '—', icon: '⏱️' },
];

const quickActions = [
  { label: 'Manage Papers', description: 'Add, edit or remove exam papers', href: '/papers', icon: '📋' },
  { label: 'Manage Questions', description: 'Create and organize question banks', href: '/questions', icon: '📝' },
  { label: 'View Users', description: 'Browse registered users and roles', href: '/users', icon: '👤' },
  { label: 'View Reports', description: 'Exam analytics and performance data', href: '/reports', icon: '📊' },
];

export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        color: '#fff',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '2rem 3rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            🎓 Admin Panel
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Exam Practice Platform — Management Dashboard
          </p>
        </div>
        <div
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          v1.0.0 — Development
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '2rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {quickActions.map((action) => (
            <div
              key={action.label}
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{action.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.35rem' }}>{action.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {action.description}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>PayloadCMS Integration Pending</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
              Full CRUD operations and content management will be available once PayloadCMS is configured.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
