-- ============================================
-- NCCMMGR - Criar Tabelas (Execute no Supabase)
-- ============================================

-- Tabela de associados
CREATE TABLE IF NOT EXISTS public.associates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    birth_date DATE,
    rg TEXT,
    cpf TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT NOT NULL,
    member_type TEXT DEFAULT 'criador',
    abccmm_registration_number TEXT,
    haras_name TEXT,
    haras_address TEXT,
    haras_city TEXT,
    haras_state TEXT,
    status TEXT DEFAULT 'aprovado',
    signature_status TEXT DEFAULT 'assinado',
    terms_accepted_at TIMESTAMPTZ,
    referred_by UUID,
    referral_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;

-- Permitir operações públicas
CREATE POLICY "allow_all_select" ON public.associates FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.associates FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.associates FOR UPDATE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_associates_cpf ON public.associates(cpf);
CREATE INDEX IF NOT EXISTS idx_associates_status ON public.associates(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_associates_updated_at
    BEFORE UPDATE ON public.associates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
