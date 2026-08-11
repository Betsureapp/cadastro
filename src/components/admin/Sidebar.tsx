'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Mountain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui';
import styles from './Sidebar.module.css';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/admin/pipeline', icon: GitBranch },
  { name: 'Associados', href: '/admin/associados', icon: Users },
  { name: 'Indicações', href: '/admin/indicacoes', icon: TrendingUp },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.email) {
          setUserName(user.email.split('@')[0]);
        }
      } catch {
        // Ignore errors during SSR
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Redirect anyway
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className={styles.mobileMenuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(styles.sidebar, isOpen && styles.open)}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Mountain size={24} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>NCCMMGR</span>
            <span className={styles.logoSubtitle}>Gestão de Associados</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(styles.navItem, isActive && styles.active)}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>Administrador</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={18} />
          </Button>
        </div>
      </aside>
    </>
  );
}

export function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar associados..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.headerActions}>
        <button className={styles.notificationButton}>
          <Bell size={20} />
          <span className={styles.notificationBadge}>3</span>
        </button>
      </div>
    </header>
  );
}
