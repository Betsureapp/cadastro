'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Award,
  Building2,
  FileCheck,
  Clock,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Hash,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, Badge, StatusBadge, SignatureBadge, Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { supabase, statusLabels, ApplicationStatus } from '@/lib/supabase';
import { formatDate, formatDateTime, formatCPF, formatPhone, getInitials } from '@/lib/utils';
import styles from './page.module.css';

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  novo_cadastro: ['aguardando_assinatura', 'em_analise', 'aprovado', 'rejeitado'],
  aguardando_assinatura: ['em_analise', 'aprovado', 'rejeitado'],
  em_analise: ['aprovado', 'rejeitado'],
  aprovado: [],
  rejeitado: ['novo_cadastro'],
};

export default function AssociateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchAssociateById, selectedAssociate, updateAssociateStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssociate = async () => {
      setIsLoading(true);
      await fetchAssociateById(params.id as string);
      setIsLoading(false);
    };
    loadAssociate();
  }, [params.id, fetchAssociateById]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!selectedAssociate) return;
    await updateAssociateStatus(selectedAssociate.id, newStatus);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Carregando dados do associado...</p>
      </div>
    );
  }

  if (!selectedAssociate) {
    return (
      <div className={styles.notFound}>
        <h2>Associado não encontrado</h2>
        <Button onClick={() => router.push('/admin/associados')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const availableTransitions = STATUS_TRANSITIONS[selectedAssociate.status];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/associados" className={styles.backLink}>
          <ArrowLeft size={20} />
          Voltar para lista
        </Link>

        <div className={styles.headerActions}>
          <Button variant="secondary">
            <Edit size={18} />
            Editar
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Left Column - Profile */}
        <div className={styles.profileSection}>
          {/* Profile Card */}
          <Card className={styles.profileCard}>
            <CardContent>
              <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                  {getInitials(selectedAssociate.full_name)}
                </div>
                <div className={styles.profileInfo}>
                  <h1 className={styles.profileName}>{selectedAssociate.full_name}</h1>
                  <div className={styles.profileBadges}>
                    <StatusBadge status={selectedAssociate.status} />
                    <SignatureBadge status={selectedAssociate.signature_status} />
                    <Badge variant={selectedAssociate.member_type === 'criador' ? 'accent' : 'default'}>
                      {selectedAssociate.member_type === 'criador' ? 'Criador' : 'Usuário'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={styles.profileDetails}>
                <div className={styles.detailItem}>
                  <Hash size={16} />
                  <span className={styles.detailLabel}>CPF</span>
                  <span className={styles.detailValue}>{formatCPF(selectedAssociate.cpf)}</span>
                </div>

                {selectedAssociate.rg && (
                  <div className={styles.detailItem}>
                    <FileCheck size={16} />
                    <span className={styles.detailLabel}>RG</span>
                    <span className={styles.detailValue}>{selectedAssociate.rg}</span>
                  </div>
                )}

                {selectedAssociate.birth_date && (
                  <div className={styles.detailItem}>
                    <Calendar size={16} />
                    <span className={styles.detailLabel}>Nascimento</span>
                    <span className={styles.detailValue}>
                      {formatDate(selectedAssociate.birth_date)}
                    </span>
                  </div>
                )}

                <div className={styles.detailItem}>
                  <Mail size={16} />
                  <span className={styles.detailLabel}>E-mail</span>
                  <span className={styles.detailValue}>{selectedAssociate.email}</span>
                </div>

                <div className={styles.detailItem}>
                  <Phone size={16} />
                  <span className={styles.detailLabel}>Telefone</span>
                  <span className={styles.detailValue}>
                    {formatPhone(selectedAssociate.phone)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Card */}
          <Card>
            <CardContent>
              <h3 className={styles.sectionTitle}>
                <MapPin size={18} />
                Endereço
              </h3>

              <div className={styles.addressInfo}>
                <p className={styles.addressLine}>
                  {selectedAssociate.address}
                </p>
                <p className={styles.addressLine}>
                  {selectedAssociate.neighborhood}, {selectedAssociate.city} - {selectedAssociate.state}
                </p>
                <p className={styles.addressLine}>CEP: {selectedAssociate.zip_code}</p>
              </div>
            </CardContent>
          </Card>

          {/* Haras Card */}
          {selectedAssociate.haras_name && (
            <Card>
              <CardContent>
                <h3 className={styles.sectionTitle}>
                  <Building2 size={18} />
                  Dados do Haras
                </h3>

                <div className={styles.harasInfo}>
                  <div className={styles.harasItem}>
                    <span className={styles.harasLabel}>Nome</span>
                    <span className={styles.harasValue}>{selectedAssociate.haras_name}</span>
                  </div>
                  {selectedAssociate.haras_address && (
                    <div className={styles.harasItem}>
                      <span className={styles.harasLabel}>Endereço</span>
                      <span className={styles.harasValue}>{selectedAssociate.haras_address}</span>
                    </div>
                  )}
                  {selectedAssociate.haras_city && (
                    <div className={styles.harasItem}>
                      <span className={styles.harasLabel}>Cidade/Estado</span>
                      <span className={styles.harasValue}>
                        {selectedAssociate.haras_city}
                        {selectedAssociate.haras_state && ` - ${selectedAssociate.haras_state}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div className={styles.actionsSection}>
          {/* Status Actions */}
          <Card className={styles.statusCard}>
            <CardContent>
              <h3 className={styles.sectionTitle}>
                <Clock size={18} />
                Alterar Status
              </h3>

              <div className={styles.statusButtons}>
                {availableTransitions.map((status) => (
                  <Button
                    key={status}
                    variant={status === 'aprovado' ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(status)}
                  >
                    {status === 'aprovado' && <Check size={16} />}
                    {status === 'rejeitado' && <X size={16} />}
                    {statusLabels[status]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ABCCMM Card */}
          <Card>
            <CardContent>
              <h3 className={styles.sectionTitle}>
                <Award size={18} />
                Dados ABCCMM
              </h3>

              <div className={styles.abccmmInfo}>
                <div className={styles.abccmmItem}>
                  <span className={styles.abccmmLabel}>Tipo</span>
                  <span className={styles.abccmmValue}>
                    {selectedAssociate.member_type === 'criador' ? 'Criador' : 'Usuário'}
                  </span>
                </div>
                <div className={styles.abccmmItem}>
                  <span className={styles.abccmmLabel}>Inscrição</span>
                  <span className={styles.abccmmValue}>
                    {selectedAssociate.abccmm_registration_number || 'Não informada'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardContent>
              <h3 className={styles.sectionTitle}>
                <Clock size={18} />
                Histórico
              </h3>

              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Cadastro criado</span>
                    <span className={styles.timelineDate}>
                      {formatDateTime(selectedAssociate.created_at)}
                    </span>
                  </div>
                </div>

                {selectedAssociate.terms_accepted_at && (
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineTitle}>Termos aceitos</span>
                      <span className={styles.timelineDate}>
                        {formatDateTime(selectedAssociate.terms_accepted_at)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedAssociate.approved_at && (
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} style={{ background: 'var(--color-success)' }} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineTitle}>Aprovado</span>
                      <span className={styles.timelineDate}>
                        {formatDateTime(selectedAssociate.approved_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
