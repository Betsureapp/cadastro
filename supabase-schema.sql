-- ============================================
-- NCCMMGR - Sistema de Cadastro e Gestão de Associados
-- Banco de Dados Supabase - v1.0.0
-- ============================================

-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Status do candidato no funil
CREATE TYPE application_status AS ENUM (
    'novo_cadastro',
    'aguardando_assinatura',
    'em_analise',
    'aprovado',
    'rejeitado'
);

-- Status da assinatura digital
CREATE TYPE signature_status AS ENUM (
    'pendente',
    'assinado',
    'rejeitado'
);

-- Tipo de membro ABCCMM
CREATE TYPE member_type AS ENUM (
    'criador',
    'usuario'
);

-- ============================================
-- TABELAS
-- ============================================

-- Tabela de perfis estendidos (ligada ao auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('admin', 'associate', 'candidate')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela principal de associados/candidatos
CREATE TABLE public.associates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Dados pessoais
    full_name TEXT NOT NULL,
    birth_date DATE,
    rg TEXT,
    cpf TEXT NOT NULL UNIQUE,

    -- Contato/Endereço
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT NOT NULL,

    -- Dados ABCCMM
    member_type member_type NOT NULL DEFAULT 'criador',
    abccmm_registration_number TEXT UNIQUE,

    -- Dados do Haras
    haras_name TEXT,
    haras_address TEXT,
    haras_city TEXT,
    haras_state TEXT,

    -- Status e controle
    status application_status NOT NULL DEFAULT 'novo_cadastro',
    signature_status signature_status NOT NULL DEFAULT 'pendente',

    -- Dados da assinatura digital
    terms_accepted_at TIMESTAMPTZ,
    terms_accepted_ip INET,
    terms_accepted_user_agent TEXT,

    -- Indicação (referral)
    referred_by UUID REFERENCES public.associates(id),
    referral_code TEXT,

    -- Relacionamento com usuário (após aprovação, cria usuário)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ
);

-- Tabela de histórico de status (audit trail)
CREATE TABLE public.status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
    old_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de códigos de indicação (links personalizados)
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cliques em links de indicação (para rastreamento)
CREATE TABLE public.referral_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_associates_cpf ON public.associates(cpf);
CREATE INDEX idx_associates_status ON public.associates(status);
CREATE INDEX idx_associates_referred_by ON public.associates(referred_by);
CREATE INDEX idx_associates_user_id ON public.associates(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_associate ON public.referral_codes(associate_id);
CREATE INDEX idx_status_history_associate ON public.status_history(associate_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico de status
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.status_history (associate_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_referral_code(associate_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Gera código: primeira letra do nome + sobrenome + 4 caracteres aleatórios
    SELECT LOWER(
        SUBSTRING(
            (SELECT full_name FROM public.associates WHERE id = associate_uuid)
            FROM 1 FOR 1
        ) ||
        REGEXP_REPLACE(
            SPLIT_PART(
                (SELECT full_name FROM public.associates WHERE id = associate_uuid),
                ' ',
                2
            ),
            '[^a-zA-Z]', '', 'g'
        ) ||
        SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            floor(random() * 36)::int + 1, 4)
    ) INTO new_code;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar usuário após aprovação
CREATE OR REPLACE FUNCTION create_user_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
        NEW.approved_by = auth.uid();
        NEW.approved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar cliques e conversões de indicação
CREATE OR REPLACE FUNCTION track_referral_click()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.referral_codes
    SET clicks_count = clicks_count + 1
    WHERE id = NEW.referral_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_referral_conversion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referred_by IS NOT NULL THEN
        UPDATE public.referral_codes
        SET conversions_count = conversions_count + 1
        WHERE associate_id = NEW.referred_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em associates
CREATE TRIGGER update_associates_updated_at
    BEFORE UPDATE ON public.associates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar histórico de status
CREATE TRIGGER record_status_change_trigger
    AFTER UPDATE ON public.associates
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION record_status_change();

-- Trigger para criar usuário na aprovação
CREATE TRIGGER create_user_on_approval_trigger
    BEFORE UPDATE ON public.associates
    FOR EACH ROW
    WHEN (NEW.status = 'aprovado' AND OLD.status != 'aprovado')
    EXECUTE FUNCTION create_user_on_approval();

-- Trigger para rastrear cliques
CREATE TRIGGER track_referral_click_trigger
    AFTER INSERT ON public.referral_clicks
    FOR EACH ROW
    EXECUTE FUNCTION track_referral_click();

-- Trigger para rastrear conversões
CREATE TRIGGER track_referral_conversion_trigger
    AFTER INSERT ON public.associates
    FOR EACH ROW
    EXECUTE FUNCTION track_referral_conversion();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - PROFILES
-- ============================================

-- Admin pode ver e editar todos os perfis
CREATE POLICY "Admin can view all profiles"
    ON public.profiles FOR SELECT
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admin can update all profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Usuário pode ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Qualquer um pode criar perfil (após signup)
CREATE POLICY "Anyone can create profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICIES - ASSOCIATES
-- ============================================

-- Admin pode ver todos os associados
CREATE POLICY "Admin can view all associates"
    ON public.associates FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
        OR auth.uid() IN (SELECT user_id FROM public.associates WHERE user_id IS NOT NULL)
    );

-- Admin pode inserir novos associados (via formulário público)
CREATE POLICY "Anyone can create associate"
    ON public.associates FOR INSERT
    WITH CHECK (true);

-- Admin pode atualizar associados
CREATE POLICY "Admin can update associates"
    ON public.associates FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- ============================================
-- POLICIES - STATUS HISTORY
-- ============================================

-- Admin pode ver todo histórico
CREATE POLICY "Admin can view status history"
    ON public.status_history FOR SELECT
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Sistema pode inserir histórico
CREATE POLICY "System can insert status history"
    ON public.status_history FOR INSERT
    WITH CHECK (true);

-- ============================================
-- POLICIES - REFERRAL CODES
-- ============================================

-- Todos podem ver códigos de indicação ativos (para compartilhamento)
CREATE POLICY "Anyone can view active referral codes"
    ON public.referral_codes FOR SELECT
    USING (is_active = true);

-- Admin pode gerenciar códigos
CREATE POLICY "Admin can manage referral codes"
    ON public.referral_codes FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Usuários podem ver seus próprios códigos
CREATE POLICY "Users can view own referral codes"
    ON public.referral_codes FOR SELECT
    USING (associate_id IN (SELECT id FROM public.associates WHERE user_id = auth.uid()));

-- ============================================
-- POLICIES - REFERRAL CLICKS
-- ============================================

-- Qualquer um pode registrar clique (via link público)
CREATE POLICY "Anyone can track referral clicks"
    ON public.referral_clicks FOR INSERT
    WITH CHECK (true);

-- Admin pode ver cliques
CREATE POLICY "Admin can view referral clicks"
    ON public.referral_clicks FOR SELECT
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- ============================================
-- STORAGE - AVATARES
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (metadata->>'owner')::text);

-- ============================================
-- FUNÇÕES PARA WEBHOOKS
-- ============================================

-- Função para disparar webhook após novo cadastro
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
BEGIN
    -- O webhook será configurado no Supabase Dashboard
    -- Realtime > Webhooks > HTTP Hook
    -- pointing to your endpoint
    PERFORM (
        SELECT net.http_post(
            url := current_setting('app.webhook_url', true),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
                'event', 'new_application',
                'timestamp', NOW(),
                'data', jsonb_build_object(
                    'id', NEW.id,
                    'full_name', NEW.full_name,
                    'email', NEW.email,
                    'cpf', NEW.cpf,
                    'phone', NEW.phone,
                    'status', NEW.status,
                    'referred_by', NEW.referred_by
                )
            )
        )
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Não falha a inserção se webhook falhar
    RAISE NOTICE 'Webhook failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para disparar webhook após mudança de status
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM (
        SELECT net.http_post(
            url := current_setting('app.webhook_url', true),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
                'event', 'status_change',
                'timestamp', NOW(),
                'data', jsonb_build_object(
                    'id', NEW.id,
                    'full_name', NEW.full_name,
                    'email', NEW.email,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'changed_by', auth.uid()
                )
            )
        )
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Webhook failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA WEBHOOKS
-- ============================================

CREATE TRIGGER on_new_application
    AFTER INSERT ON public.associates
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_application();

CREATE TRIGGER on_status_change
    AFTER UPDATE OF status ON public.associates
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_status_change();

-- ============================================
-- VIEWS PARA RELATÓRIOS
-- ============================================

-- View de pipeline de candidatos
CREATE OR REPLACE VIEW public.pipeline_view AS
SELECT
    a.id,
    a.full_name,
    a.email,
    a.phone,
    a.status,
    a.signature_status,
    a.created_at,
    a.member_type,
    p.full_name AS referred_by_name,
    rc.code AS referral_code,
    rc.clicks_count,
    rc.conversions_count,
    CASE
        WHEN a.status = 'novo_cadastro' THEN 1
        WHEN a.status = 'aguardando_assinatura' THEN 2
        WHEN a.status = 'em_analise' THEN 3
        WHEN a.status = 'aprovado' THEN 4
        WHEN a.status = 'rejeitado' THEN 5
    END AS pipeline_order
FROM public.associates a
LEFT JOIN public.associates p ON a.referred_by = p.id
LEFT JOIN public.referral_codes rc ON a.referred_by = rc.associate_id;

-- View de associados ativos
CREATE OR REPLACE VIEW public.active_associates_view AS
SELECT
    a.id,
    a.full_name,
    a.email,
    a.phone,
    a.member_type,
    a.abccmm_registration_number,
    a.haras_name,
    a.approved_at,
    u.email AS user_email
FROM public.associates a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.status = 'aprovado';

-- View de estatísticas de indicações
CREATE OR REPLACE VIEW public.referral_stats_view AS
SELECT
    p.full_name,
    p.id AS associate_id,
    rc.code,
    rc.clicks_count,
    rc.conversions_count,
    CASE
        WHEN rc.clicks_count > 0
        THEN ROUND((rc.conversions_count::numeric / rc.clicks_count) * 100, 2)
        ELSE 0
    END AS conversion_rate
FROM public.referral_codes rc
JOIN public.associates a ON rc.associate_id = a.id
LEFT JOIN public.profiles p ON a.user_id = p.id
WHERE rc.is_active = true;

-- ============================================
-- CONSTRAINTS DE VALIDAÇÃO
-- ============================================

-- Validação de CPF (formato básico)
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_cpf TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    i INTEGER;
BEGIN
    -- Remove pontos e traços
    clean_cpf := REGEXP_REPLACE(cpf, '[.\-]', '', 'g');

    -- Verifica se tem 11 dígitos
    IF LENGTH(clean_cpf) != 11 THEN
        RETURN FALSE;
    END IF;

    -- Verifica se todos os dígitos são iguais
    IF clean_cpf = REPEAT(SUBSTRING(clean_cpf FROM 1 FOR 1), 11) THEN
        RETURN FALSE;
    END IF;

    -- Calcula primeiro dígito
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (SUBSTRING(clean_cpf FROM i FOR 1)::INT) * (11 - i);
    END LOOP;
    digit1 := CASE WHEN (11 - (sum1 % 11)) > 9 THEN 0 ELSE (11 - (sum1 % 11)) END;

    IF digit1 != (SUBSTRING(clean_cpf FROM 10 FOR 1)::INT) THEN
        RETURN FALSE;
    END IF;

    -- Calcula segundo dígito
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (SUBSTRING(clean_cpf FROM i FOR 1)::INT) * (12 - i);
    END LOOP;
    digit2 := CASE WHEN (11 - (sum2 % 11)) > 9 THEN 0 ELSE (11 - (sum2 % 11)) END;

    IF digit2 != (SUBSTRING(clean_cpf FROM 11 FOR 1)::INT) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar constraint de validação de CPF
ALTER TABLE public.associates
ADD CONSTRAINT validate_cpf_format
CHECK (validate_cpf(cpf) = TRUE);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar se email é único
CREATE OR REPLACE FUNCTION check_email_uniqueness(email TEXT, exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.associates
        WHERE email = email
        AND (exclude_id IS NULL OR id != exclude_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se CPF é único
CREATE OR REPLACE FUNCTION check_cpf_uniqueness(cpf TEXT, exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.associates
        WHERE cpf = REGEXP_REPLACE(cpf, '[.\-]', '', 'g')
        AND (exclude_id IS NULL OR id != exclude_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se registro ABCCMM é único
CREATE OR REPLACE FUNCTION check_abccmm_uniqueness(reg_number TEXT, exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF reg_number IS NULL OR reg_number = '' THEN
        RETURN TRUE;
    END IF;

    RETURN NOT EXISTS (
        SELECT 1 FROM public.associates
        WHERE abccmm_registration_number = reg_number
        AND (exclude_id IS NULL OR id != exclude_id)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - Admin inicial
-- ============================================
-- OBS: O admin será criado via signup, não via seed
-- Esta seção é apenas para referência

-- Para criar um admin manualmente após o signup:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'user-uuid-here';

COMMENT ON TABLE public.associates IS 'Tabela principal de associados e candidatos do NCCMMGR';
COMMENT ON TABLE public.profiles IS 'Perfis estendidos dos usuários (ligados ao auth.users)';
COMMENT ON TABLE public.referral_codes IS 'Códigos de indicação para cada associado';
COMMENT ON TABLE public.status_history IS 'Histórico de mudanças de status dos candidatos';
