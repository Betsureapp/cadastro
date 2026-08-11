'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, UserPlus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { supabase, type Associate } from '@/lib/supabase';
import { formatDate, formatCPF, getInitials } from '@/lib/utils';
import styles from './page.module.css';

const TABS = [
  { id: 'aprovado', title: 'Aprovados', color: 'var(--color-success)' },
  { id: 'rejeitado', title: 'Cancelados', color: 'var(--color-error)' },
];

export default function PipelinePage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('aprovado');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('associates')
      .select('*')
      .in('status', ['aprovado', 'rejeitado'])
      .order('updated_at', { ascending: false });

    if (data) {
      setAssociates(data);
    }
    setIsLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'aprovado' ? 'rejeitado' : 'aprovado';

    await supabase
      .from('associates')
      .update({ status: newStatus })
      .eq('id', id);

    fetchAssociates();
  };

  // Filtra associados
  const filteredAssociates = associates.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(term) ||
      a.cpf.includes(term) ||
      a.email.toLowerCase().includes(term)
    );
  });

  // Filtra por tab ativa
  const tabAssociates = filteredAssociates.filter(a => a.status === activeTab);

  // Navegação do carrossel
  const nextCard = () => {
    setCurrentIndex(prev => (prev + 1) % Math.max(tabAssociates.length, 1));
  };

  const prevCard = () => {
    setCurrentIndex(prev => (prev - 1 + Math.max(tabAssociates.length, 1)) % Math.max(tabAssociates.length, 1));
  };

  const currentAssociate = tabAssociates[currentIndex];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Associados</h1>
          <p className={styles.subtitle}>
            {associates.length} total no sistema
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentIndex(0);
              }}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentIndex(0);
            }}
            style={activeTab === tab.id ? { borderColor: tab.color, color: tab.color } : {}}
          >
            {tab.title}
            <Badge size="sm">
              {associates.filter(a => a.status === tab.id).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Carousel */}
      {tabAssociates.length > 0 ? (
        <div className={styles.carousel}>
          <button className={styles.navButton} onClick={prevCard} disabled={tabAssociates.length <= 1}>
            <ChevronLeft size={24} />
          </button>

          <div className={styles.cardContainer}>
            {currentAssociate && (
              <Card className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {getInitials(currentAssociate.full_name)}
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{currentAssociate.full_name}</h3>
                    <p className={styles.cpf}>{formatCPF(currentAssociate.cpf)}</p>
                  </div>
                  <Badge variant={currentAssociate.status === 'aprovado' ? 'success' : 'error'} size="sm">
                    {currentAssociate.status === 'aprovado' ? 'Ativo' : 'Cancelado'}
                  </Badge>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <span className={styles.label}>E-mail:</span>
                    <span className={styles.value}>{currentAssociate.email}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Telefone:</span>
                    <span className={styles.value}>{currentAssociate.phone || '-'}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Cidade:</span>
                    <span className={styles.value}>
                      {currentAssociate.city}/{currentAssociate.state}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Tipo:</span>
                    <Badge variant={currentAssociate.member_type === 'criador' ? 'primary' : 'secondary'} size="sm">
                      {currentAssociate.member_type === 'criador' ? 'Criador' : 'Usuário'}
                    </Badge>
                  </div>
                  {currentAssociate.haras_name && (
                    <div className={styles.row}>
                      <span className={styles.label}>Haras:</span>
                      <span className={styles.value}>{currentAssociate.haras_name}</span>
                    </div>
                  )}
                  <div className={styles.row}>
                    <span className={styles.label}>Desde:</span>
                    <span className={styles.value}>{formatDate(currentAssociate.created_at)}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <Button
                    variant={currentAssociate.status === 'aprovado' ? 'danger' : 'primary'}
                    onClick={() => toggleStatus(currentAssociate.id, currentAssociate.status)}
                  >
                    {currentAssociate.status === 'aprovado' ? (
                      <>
                        <X size={16} />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Aprovar
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <button className={styles.navButton} onClick={nextCard} disabled={tabAssociates.length <= 1}>
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <UserPlus size={48} />
          <h3>Nenhum associado</h3>
          <p>Não há associados {activeTab === 'aprovado' ? 'aprovados' : 'cancelados'}</p>
        </div>
      )}

      {/* Navigation dots */}
      {tabAssociates.length > 1 && (
        <div className={styles.dots}>
          <span className={styles.dotInfo}>
            {currentIndex + 1} de {tabAssociates.length}
          </span>
          <div className={styles.dotIndicators}>
            {tabAssociates.slice(0, Math.min(tabAssociates.length, 5)).map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${currentIndex === i ? styles.activeDot : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
}
