'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mountain, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import styles from './page.module.css';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Verifica se já está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push('/admin');
        } else {
          setIsChecking(false);
        }
      } catch {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Verifica se é link de referência
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
      router.push('/cadastro');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = getSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Erro ao fazer login');
    }

    setIsLoading(false);
  };

  if (isChecking) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Pattern */}
      <div className={styles.pattern} />

      {/* Login Card */}
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Mountain size={32} />
          </div>
          <h1 className={styles.logoTitle}>NCCMMGR</h1>
          <p className={styles.logoSubtitle}>
            Núcleo dos Criadores de Cavalos<br />Mangalarga Marchador
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>Acessar painel administrativo</h2>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.inputIcon}>
              <Mail size={18} />
            </div>
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputIcon}>
              <Lock size={18} />
            </div>
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" size="lg" isLoading={isLoading}>
            Entrar
          </Button>

          <a href="#" className={styles.forgotPassword}>
            Esqueceu sua senha?
          </a>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Deseja se tornar um associado?</p>
          <a href="/cadastro" className={styles.registerLink}>
            Preencha o formulário aqui
          </a>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className={styles.decoration}>
        <svg viewBox="0 0 200 200" className={styles.horseSvg}>
          <path
            d="M100 20 C 120 20, 140 40, 140 60 C 140 80, 120 90, 100 90 C 80 90, 60 80, 60 60 C 60 40, 80 20, 100 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <path
            d="M100 90 L 100 140 M 80 160 L 100 140 L 120 160 M 70 120 L 100 110 L 130 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
