'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, AdminHeader } from '@/components/admin';
import { getCurrentUser } from '@/lib/auth';
import styles from './layout.module.css';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <AdminHeader />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
