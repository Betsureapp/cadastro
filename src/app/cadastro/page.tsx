'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mountain, User, MapPin, Award, Building2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button, Input, Select, Card } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { validateCPF, BRAZILIAN_STATES, formatPhone, formatCPF, formatCEP } from '@/lib/utils';
import styles from './page.module.css';

interface FormData {
  full_name: string;
  birth_date: string;
  rg: string;
  cpf: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  member_type: 'criador' | 'usuario';
  abccmm_registration_number: string;
  haras_name: string;
  haras_address: string;
  haras_city: string;
  haras_state: string;
  terms_accepted: boolean;
}

const STEPS = [
  { id: 'personal', title: 'Dados Pessoais', icon: User },
  { id: 'address', title: 'Endereço', icon: MapPin },
  { id: 'abccmm', title: 'ABCCMM', icon: Award },
  { id: 'haras', title: 'Haras', icon: Building2 },
  { id: 'terms', title: 'Termos', icon: CheckCircle },
];

export default function CadastroPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    birth_date: '',
    rg: '',
    cpf: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    member_type: 'criador',
    abccmm_registration_number: '',
    haras_name: '',
    haras_address: '',
    haras_city: '',
    haras_state: '',
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const storedRef = localStorage.getItem('referral_code');
    if (storedRef) {
      // Pode usar depois
    }
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatField = (field: string, value: string) => {
    if (field === 'phone') return formatPhone(value);
    if (field === 'cpf') return formatCPF(value);
    if (field === 'zip_code') return formatCEP(value);
    return value;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Nome é obrigatório';
      if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
      else if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
      if (!formData.birth_date) newErrors.birth_date = 'Data de nascimento é obrigatória';
    }

    if (step === 1) {
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state) newErrors.state = 'Estado é obrigatório';
      if (!formData.zip_code.trim()) newErrors.zip_code = 'CEP é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'E-mail inválido';
    }

    if (step === 4) {
      if (!formData.terms_accepted) newErrors.terms = 'Você precisa aceitar os termos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('associates').insert({
        full_name: formData.full_name,
        birth_date: formData.birth_date,
        rg: formData.rg || null,
        cpf: formData.cpf.replace(/\D/g, ''),
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        phone: formData.phone,
        email: formData.email,
        member_type: formData.member_type,
        abccmm_registration_number: formData.abccmm_registration_number || null,
        haras_name: formData.haras_name || null,
        haras_address: formData.haras_address || null,
        haras_city: formData.haras_city || null,
        haras_state: formData.haras_state || null,
        status: 'aprovado',
        signature_status: 'assinado',
        terms_accepted_at: new Date().toISOString(),
      });

      if (error) {
        if (error.message.includes('cpf')) {
          setErrors({ cpf: 'CPF já cadastrado' });
        } else {
          setErrors({ submit: error.message });
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setErrors({ submit: 'Erro ao enviar formulário' });
    }

    setIsLoading(false);
  };

  const handleFinalSubmit = () => {
    handleSubmit();
  };

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <Card className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={64} />
          </div>
          <h1 className={styles.successTitle}>Cadastro Realizado!</h1>
          <p className={styles.successText}>
            Seu cadastro foi enviado com sucesso e já está aprovado.
            Em breve entraremos em contato pelo e-mail informado.
          </p>
          <Button onClick={() => router.push('/')}>
            Voltar ao início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <Mountain size={32} />
        </div>
        <h1 className={styles.title}>Cadastro de Associado</h1>
        <p className={styles.subtitle}>
          Preencha os dados abaixo para se tornar um membro do NCCMMGR
        </p>
      </div>

      {/* Progress */}
      <div className={styles.progress}>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`${styles.progressStep} ${
                index === currentStep ? styles.active : ''
              } ${index < currentStep ? styles.completed : ''}`}
            >
              <div className={styles.progressIcon}>
                {index < currentStep ? <CheckCircle size={20} /> : <Icon size={20} />}
              </div>
              <span className={styles.progressLabel}>{step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <Card className={styles.formCard}>
        {/* Step 1: Dados Pessoais */}
        {currentStep === 0 && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Dados Pessoais</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nome Completo *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Digite seu nome completo"
                error={errors.full_name}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Data de Nascimento *</label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  error={errors.birth_date}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>CPF *</label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', formatField('cpf', e.target.value))}
                  placeholder="000.000.000-00"
                  error={errors.cpf}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>RG</label>
              <Input
                value={formData.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
                placeholder="Documento de identidade"
              />
            </div>
          </div>
        )}

        {/* Step 2: Endereço */}
        {currentStep === 1 && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Contato e Endereço</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Endereço *</label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, número, complemento"
                error={errors.address}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Bairro *</label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  placeholder="Bairro"
                  error={errors.neighborhood}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cidade *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Cidade"
                  error={errors.city}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Estado *</label>
                <Select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  options={[
                    { value: '', label: 'Selecione' },
                    ...BRAZILIAN_STATES.map(s => ({ value: s.value, label: s.label }))
                  ]}
                  error={errors.state}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>CEP *</label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', formatField('zip_code', e.target.value))}
                  placeholder="00000-000"
                  error={errors.zip_code}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Telefone *</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', formatField('phone', e.target.value))}
                  placeholder="(00) 00000-0000"
                  error={errors.phone}
                  inputMode="tel"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>E-mail *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  error={errors.email}
                  inputMode="email"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: ABCCMM */}
        {currentStep === 2 && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Dados ABCCMM</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Membro *</label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioOption} ${formData.member_type === 'criador' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="member_type"
                    value="criador"
                    checked={formData.member_type === 'criador'}
                    onChange={() => handleChange('member_type', 'criador')}
                  />
                  <span>Criador</span>
                </label>
                <label className={`${styles.radioOption} ${formData.member_type === 'usuario' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="member_type"
                    value="usuario"
                    checked={formData.member_type === 'usuario'}
                    onChange={() => handleChange('member_type', 'usuario')}
                  />
                  <span>Usuário</span>
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Número de Inscrição ABCCMM</label>
              <Input
                value={formData.abccmm_registration_number}
                onChange={(e) => handleChange('abccmm_registration_number', e.target.value)}
                placeholder="Se já possui"
              />
            </div>
          </div>
        )}

        {/* Step 4: Haras */}
        {currentStep === 3 && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Dados do Haras <span className={styles.optional}>(opcional)</span></h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nome do Haras</label>
              <Input
                value={formData.haras_name}
                onChange={(e) => handleChange('haras_name', e.target.value)}
                placeholder="Nome do haras ou propriedade"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Endereço do Haras</label>
              <Input
                value={formData.haras_address}
                onChange={(e) => handleChange('haras_address', e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cidade</label>
                <Input
                  value={formData.haras_city}
                  onChange={(e) => handleChange('haras_city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Estado</label>
                <Select
                  value={formData.haras_state}
                  onChange={(e) => handleChange('haras_state', e.target.value)}
                  options={[
                    { value: '', label: 'UF' },
                    ...BRAZILIAN_STATES.map(s => ({ value: s.value, label: s.value }))
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Termos */}
        {currentStep === 4 && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Termos e Condições</h2>

            <div className={styles.termsBox}>
              <h3>Termo de Adesão ao NCCMMGR</h3>
              <p>
                Ao preencher este formulário, declaro que li e aceito os estatutos do
                Núcleo dos Criadores de Cavalos Mangalarga Marchador de Guanambi e Região (NCCMMGR),
                bem como as normas e regulamentos vigentes.
              </p>
              <p>
                Comprometo-me a pagar as contribuições associativas conforme estabelecido
                pela diretoria e a zelar pelo prestígio e pelos objetivos do Núcleo.
              </p>
              <p>
                Declaro ainda que as informações fornecidas são verdadeiras e me responsabilizo
                pela sua precisão, sob as penas da lei.
              </p>
            </div>

            <label className={`${styles.checkbox} ${errors.terms ? styles.error : ''}`}>
              <input
                type="checkbox"
                checked={formData.terms_accepted}
                onChange={(e) => handleChange('terms_accepted', e.target.checked)}
              />
              <span>Li e aceito os termos e condições acima *</span>
            </label>
            {errors.terms && <p className={styles.errorText}>{errors.terms}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          {currentStep > 0 && (
            <Button variant="secondary" onClick={prevStep}>
              <ChevronLeft size={18} />
              Anterior
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Próximo
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleFinalSubmit} isLoading={isLoading}>
              Finalizar Cadastro
            </Button>
          )}
        </div>

        {errors.submit && (
          <p className={styles.submitError}>{errors.submit}</p>
        )}
      </Card>
    </div>
  );
}
