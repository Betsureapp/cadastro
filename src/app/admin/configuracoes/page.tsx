'use client';

import { useState, useEffect } from 'react';
import { Settings, Users, Shield, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { supabase, type Profile } from '@/lib/supabase';
import styles from './page.module.css';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (data) {
      setAdmins(data);
    }
  };

  const addAdmin = async (email: string) => {
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Buscar usuário pelo e-mail
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { p_email: email });

      if (userError) {
        // Tenta buscar diretamente
        const { data: users } = await supabase
          .from('auth.users')
          .select('id, email')
          .eq('email', email)
          .single();

        if (!users) {
          setMessage({ type: 'error', text: 'Usuário não encontrado. Verifique se o e-mail está correto.' });
          setIsLoading(false);
          return;
        }

        // Verificar se já é admin
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', users.id)
          .single();

        if (existingProfile?.role === 'admin') {
          setMessage({ type: 'error', text: 'Este usuário já é administrador.' });
          setIsLoading(false);
          return;
        }

        // Criar/atualizar profile
        if (existingProfile) {
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', users.id);
        } else {
          await supabase
            .from('profiles')
            .insert({ id: users.id, role: 'admin', full_name: email.split('@')[0] });
        }

        setMessage({ type: 'success', text: 'Administrador adicionado com sucesso!' });
        setNewAdminEmail('');
        fetchAdmins();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar administrador.' });
    }

    setIsLoading(false);
  };

  const removeAdmin = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) return;

    await supabase
      .from('profiles')
      .update({ role: 'candidate' })
      .eq('id', id);

    fetchAdmins();
    setMessage({ type: 'success', text: 'Administrador removido.' });
  };

  const tabs = [
    { id: 'admins', label: 'Administradores', icon: Shield },
    { id: 'general', label: 'Geral', icon: Settings },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>
          Gerencie administradores e configurações do sistema
        </p>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Sidebar */}
        <nav className={styles.sidebar}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'admins' && (
            <Card>
              <CardContent>
                <h2 className={styles.sectionTitle}>
                  <Shield size={20} />
                  Administradores do Sistema
                </h2>
                <p className={styles.sectionDescription}>
                  Gerencie quem pode acessar o painel administrativo.
                </p>

                {message && (
                  <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                  </div>
                )}

                {/* Add new admin */}
                <div className={styles.addAdmin}>
                  <Input
                    placeholder="E-mail do novo administrador"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={() => addAdmin(newAdminEmail)} isLoading={isLoading}>
                    <Plus size={18} />
                    Adicionar
                  </Button>
                </div>

                {/* List admins */}
                <div className={styles.adminList}>
                  <h3 className={styles.listTitle}>
                    <Users size={16} />
                    Administradores atuais
                  </h3>

                  {admins.length === 0 ? (
                    <p className={styles.emptyText}>Nenhum administrador encontrado.</p>
                  ) : (
                    <div className={styles.adminItems}>
                      {admins.map((admin) => (
                        <div key={admin.id} className={styles.adminItem}>
                          <div className={styles.adminAvatar}>
                            {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className={styles.adminInfo}>
                            <span className={styles.adminName}>
                              {admin.full_name || 'Usuário'}
                            </span>
                            <span className={styles.adminEmail}>
                              {admin.id}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdmin(admin.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.infoBox}>
                  <AlertCircle size={16} />
                  <p>
                    Para adicionar um administrador, o usuário precisa primeiro ter uma conta
                    criada na aba Authentication do Supabase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'general' && (
            <Card>
              <CardContent>
                <h2 className={styles.sectionTitle}>
                  <Settings size={20} />
                  Configurações Gerais
                </h2>

                <div className={styles.infoBox}>
                  <p>
                    Configurações gerais do sistema em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
