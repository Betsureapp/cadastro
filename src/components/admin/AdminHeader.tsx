'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import styles from './AdminHeader.module.css';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>Painel Administrativo</span>
      </div>

      <div className={styles.right}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
