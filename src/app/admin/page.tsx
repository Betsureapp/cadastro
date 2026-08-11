'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { supabase, type Associate } from '@/lib/supabase';
import styles from './page.module.css';

export default function DashboardPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    const { data } = await supabase
      .from('associates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setAssociates(data);
    }
    setIsLoading(false);
  };

  // Estatísticas
  const totalAssociates = associates.length;
  const approvedAssociates = associates.filter(a => a.status === 'aprovado').length;
  const rejectedAssociates = associates.filter(a => a.status === 'rejeitado').length;

  // Por tipo de membro
  const criadorCount = associates.filter(a => a.member_type === 'criador').length;
  const usuarioCount = associates.filter(a => a.member_type === 'usuario').length;

  // Associados recentes (últimos 7 dias)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentAssociates = associates.filter(a =>
    new Date(a.created_at) >= weekAgo
  ).length;

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Visão geral do sistema de gestão de associados
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent>
            <div className={styles.statIcon} style={{ background: 'rgba(246, 130, 31, 0.15)', color: 'var(--color-accent)' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{totalAssociates}</span>
              <span className={styles.statTitle}>Total de Cadastros</span>
              <span className={styles.statSubtitle}>{recentAssociates} nos últimos 7 dias</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <div className={styles.statIcon} style={{ background: 'rgba(0, 200, 83, 0.15)', color: 'var(--color-success)' }}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{approvedAssociates}</span>
              <span className={styles.statTitle}>Associados Ativos</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <div className={styles.statIcon} style={{ background: 'rgba(255, 71, 71, 0.15)', color: 'var(--color-error)' }}>
              <XCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{rejectedAssociates}</span>
              <span className={styles.statTitle}>Cadastros Cancelados</span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent>
            <div className={styles.statIcon} style={{ background: 'rgba(0, 176, 255, 0.15)', color: 'var(--color-info)' }}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{recentAssociates}</span>
              <span className={styles.statTitle}>Novos esta Semana</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className={styles.detailsGrid}>
        <Card>
          <CardContent>
            <h3 className={styles.cardTitle}>Distribuição por Tipo</h3>
            <div className={styles.distribution}>
              <div className={styles.distributionItem}>
                <div className={styles.distributionBar}>
                  <div
                    className={styles.distributionFill}
                    style={{
                      width: totalAssociates ? `${(criadorCount / totalAssociates) * 100}%` : '0%',
                      background: 'var(--color-accent)'
                    }}
                  />
                </div>
                <div className={styles.distributionInfo}>
                  <span className={styles.distributionLabel}>Criadores</span>
                  <span className={styles.distributionValue}>{criadorCount}</span>
                </div>
              </div>
              <div className={styles.distributionItem}>
                <div className={styles.distributionBar}>
                  <div
                    className={styles.distributionFill}
                    style={{
                      width: totalAssociates ? `${(usuarioCount / totalAssociates) * 100}%` : '0%',
                      background: 'var(--color-info)'
                    }}
                  />
                </div>
                <div className={styles.distributionInfo}>
                  <span className={styles.distributionLabel}>Usuários</span>
                  <span className={styles.distributionValue}>{usuarioCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className={styles.cardTitle}>Status dos Associados</h3>
            <div className={styles.pipelineStats}>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineDot} style={{ background: 'var(--color-success)' }} />
                <span className={styles.pipelineLabel}>Aprovados</span>
                <span className={styles.pipelineCount}>{approvedAssociates}</span>
              </div>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineDot} style={{ background: 'var(--color-error)' }} />
                <span className={styles.pipelineLabel}>Cancelados</span>
                <span className={styles.pipelineCount}>{rejectedAssociates}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className={styles.cardTitle}>Link para Cadastro</h3>
            <p className={styles.linkInfo}>
              Compartilhe este link para novos associados:
            </p>
            <code className={styles.linkCode}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/cadastro
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
