'use client';

import { useEffect, useState } from 'react';
import { Link2, Copy, Check, Plus, Trash2, Users, TrendingUp, MousePointer } from 'lucide-react';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { supabase, type Associate } from '@/lib/supabase';
import styles from './page.module.css';

export default function IndicacoesPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newAssociateName, setNewAssociateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('associates')
      .select('*')
      .eq('status', 'aprovado')
      .order('full_name');

    if (data) {
      setAssociates(data);
    }
    setIsLoading(false);
  };

  const copyLink = (code: string, id: string) => {
    const url = `${baseUrl}/cadastro?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyMainLink = () => {
    navigator.clipboard.writeText(`${baseUrl}/cadastro`);
    setCopiedId('main');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createReferralCode = async (associateId: string, name: string) => {
    if (!newAssociateName.trim()) return;

    setIsCreating(true);

    // Gerar código baseado no nome
    const code = newAssociateName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8) +
      Math.random().toString(36).substring(2, 6);

    // Por enquanto, apenas atualiza o campo referral_code do associate
    await supabase
      .from('associates')
      .update({ referral_code: code })
      .eq('id', associateId);

    setNewAssociateName('');
    fetchAssociates();
    setIsCreating(false);
  };

  const mainLink = `${baseUrl}/cadastro`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Links de Indicação</h1>
        <p className={styles.subtitle}>
          Compartilhe links para novos membros se associarem ao NCCMMGR
        </p>
      </div>

      {/* Link Principal */}
      <Card className={styles.mainLinkCard}>
        <CardContent>
          <div className={styles.mainLinkHeader}>
            <Link2 size={24} />
            <h3>Link Principal de Cadastro</h3>
          </div>
          <p className={styles.mainLinkDescription}>
            Use este link para divulgação geral. Não rastreia quem indicou.
          </p>
          <div className={styles.linkBox}>
            <code className={styles.linkCode}>{mainLink}</code>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyMainLink}
            >
              {copiedId === 'main' ? <Check size={16} /> : <Copy size={16} />}
              {copiedId === 'main' ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <Users size={20} />
          <span className={styles.statValue}>{associates.length}</span>
          <span className={styles.statLabel}>Associados</span>
        </div>
      </div>

      {/* Links Personalizados */}
      <Card>
        <CardContent>
          <h3 className={styles.sectionTitle}>
            <Link2 size={20} />
            Links Personalizados por Associado
          </h3>
          <p className={styles.sectionDescription}>
            Cada associado pode ter um link único para rastrear indicações.
          </p>

          {isLoading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : associates.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} />
              <p>Nenhum associado aprovado ainda</p>
              <span>Cadastros aparecerão aqui automaticamente</span>
            </div>
          ) : (
            <div className={styles.linksList}>
              {associates.map((associate) => (
                <div key={associate.id} className={styles.linkItem}>
                  <div className={styles.linkInfo}>
                    <div className={styles.associateAvatar}>
                      {associate.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.associateDetails}>
                      <span className={styles.associateName}>{associate.full_name}</span>
                      {associate.referral_code ? (
                        <code className={styles.code}>{associate.referral_code}</code>
                      ) : (
                        <span className={styles.noCode}>Sem código</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.linkActions}>
                    {associate.referral_code ? (
                      <div className={styles.linkBox}>
                        <code className={styles.linkCode}>
                          {mainLink.replace('/cadastro', '')}/cadastro?ref={associate.referral_code}
                        </code>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => copyLink(associate.referral_code!, associate.id)}
                        >
                          {copiedId === associate.id ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                          {copiedId === associate.id ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    ) : (
                      <div className={styles.createCode}>
                        <Input
                          placeholder="Nome para gerar código"
                          value={newAssociateName}
                          onChange={(e) => setNewAssociateName(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => createReferralCode(associate.id, associate.full_name)}
                          isLoading={isCreating}
                        >
                          <Plus size={16} />
                          Gerar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como Funciona */}
      <Card className={styles.helpCard}>
        <CardContent>
          <h3 className={styles.helpTitle}>Como funciona?</h3>
          <div className={styles.helpSteps}>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <strong>Gere um link personalizado</strong>
                <p>Clique em "Gerar" ao lado do nome de cada associado</p>
              </div>
            </div>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <strong>Copie e compartilhe</strong>
                <p>Envie o link para potenciais novos membros via WhatsApp</p>
              </div>
            </div>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <strong>Acompanhe</strong>
                <p>Veja quem foram as indicações no painel de associados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
