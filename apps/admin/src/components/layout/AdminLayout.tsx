'use client';

import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAdminAuth } from '@/hooks/useAdminAuth';

const { Header, Content, Sider } = Layout;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">Dashboard</Link>,
    },
    {
      key: '/papers',
      icon: <FileTextOutlined />,
      label: <Link href="/papers">Manage Papers</Link>,
    },
    {
      key: '/questions',
      icon: <QuestionCircleOutlined />,
      label: <Link href="/questions">Manage Questions</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link href="/users">View Users</Link>,
    },
  ];

  const userMenu = [
    {
      key: 'profile',
      label: <span style={{ color: '#888' }}>{user?.email}</span>,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => logout(),
    },
  ];

  // Do not wrap the login page in the dashboard layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Prevent full layout rendering if not authenticated, hook will redirect to /login
  if (isLoading || (!isAuthenticated && pathname !== '/login')) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29' }}>
        <span style={{ color: 'white' }}>Redirecting to login...</span>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={250} 
        theme="dark"
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          background: '#0f0c29'
        }}
      >
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>🎓 Admin Panel</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname || '/']}
          items={menuItems}
          style={{ background: 'transparent', borderRight: 0, marginTop: '1rem' }}
        />
      </Sider>
      <Layout>
        <Header 
          style={{ 
            padding: '0 2rem', 
            background: '#fff', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            zIndex: 1
          }}
        >
          <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4F46E5' }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name || 'Administrator'}</span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>{user?.role || 'admin'}</span>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '1.5rem', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
