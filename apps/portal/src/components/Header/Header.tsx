'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.scss';

const { Header: AntHeader } = Layout;

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <span className={styles.userEmail}>{user?.email}</span>,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => logout(),
    },
  ];

  return (
    <AntHeader className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoIcon}>📝</span>
            <span className={styles.logoText}>Exam Portal</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link 
            href="/papers" 
            className={`${styles.navLink} ${pathname?.startsWith('/papers') ? styles.active : ''}`}
          >
            Papers
          </Link>
        </nav>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className={styles.userProfile}>
                <Avatar 
                  size="default" 
                  icon={<UserOutlined />} 
                  className={styles.avatar}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <span className={styles.userName}>{user?.name}</span>
              </div>
            </Dropdown>
          ) : (
            <>
              <Link href="/login">
                <Button type="text" className={styles.loginBtn}>
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button type="primary" className={styles.registerBtn}>
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </AntHeader>
  );
}
