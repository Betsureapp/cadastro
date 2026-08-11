'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronRight, Mail, Phone, MapPin, Building2, Eye, MoreHorizontal } from 'lucide-react';
import { Card, Badge, StatusBadge, Button, Input, Select } from '@/components/ui';
import { useAppStore } from '@/store';
import { Associate } from '@/lib/supabase';
import { formatDate, formatCPF, formatPhone, getInitials } from '@/lib/utils';
import styles from './page.module.css';

const MEMBER_TYPES = [
  { value: '', label: 'Todos os tipos' },
  { value: 'criador', label: 'Criador' },
  { value: 'usuario', label: 'Usuário' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'novo_cadastro', label: 'Novo Cadastro' },
  { value: 'aguardando_assinatura', label: 'Aguardando Assinatura' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
];

export default function AssociadosPage() {
  const { associates, fetchAssociates, isLoadingAssociates } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAssociates();
  }, [fetchAssociates]);

  // Filtra associados
  const filteredAssociates = associates.filter(a => {
    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        a.full_name.toLowerCase().includes(term) ||
        a.cpf.includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.haras_name?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Filtro de tipo
    if (memberTypeFilter && a.member_type !== memberTypeFilter) {
      return false;
    }

    // Filtro de status
    if (statusFilter && a.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Apenas aprovados para lista de associados
  const approvedAssociates = filteredAssociates.filter(a => a.status === 'aprovado');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Associados</h1>
          <p className={styles.subtitle}>
            {approvedAssociates.length} associados ativos no núcleo
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail ou haras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <Select
            options={MEMBER_TYPES}
            value={memberTypeFilter}
            onChange={(e) => setMemberTypeFilter(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Associado</th>
                <th>Contato</th>
                <th>Tipo</th>
                <th>Haras</th>
                <th>Inscrição ABCCMM</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {approvedAssociates.map((associate) => (
                <tr key={associate.id}>
                  <td>
                    <div className={styles.associateCell}>
                      <div className={styles.avatar}>
                        {getInitials(associate.full_name)}
                      </div>
                      <div className={styles.associateInfo}>
                        <span className={styles.associateName}>{associate.full_name}</span>
                        <span className={styles.associateCpf}>{formatCPF(associate.cpf)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactCell}>
                      <span className={styles.contactItem}>
                        <Mail size={14} />
                        {associate.email}
                      </span>
                      <span className={styles.contactItem}>
                        <Phone size={14} />
                        {formatPhone(associate.phone)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={associate.member_type === 'criador' ? 'accent' : 'default'} size="sm">
                      {associate.member_type === 'criador' ? 'Criador' : 'Usuário'}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.harasCell}>
                      {associate.haras_name ? (
                        <>
                          <Building2 size={14} />
                          <span>{associate.haras_name}</span>
                        </>
                      ) : (
                        <span className={styles.noHaras}>-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.registration}>
                      {associate.abccmm_registration_number || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.date}>
                      {formatDate(associate.approved_at || associate.created_at)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/associados/${associate.id}`} className={styles.viewButton}>
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {approvedAssociates.length === 0 && (
            <div className={styles.emptyState}>
              <p>Nenhum associado encontrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
