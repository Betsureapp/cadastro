-- ============================================
-- NCCMMGR - Corrigir Tabelas
-- ============================================

-- 1. Mudar status default para 'aprovado'
ALTER TABLE public.associates
ALTER COLUMN status SET DEFAULT 'aprovado'::application_status;

-- 2. Mudar signature_status default para 'assinado'
ALTER TABLE public.associates
ALTER COLUMN signature_status SET DEFAULT 'assinado'::signature_status;

-- 3. Dropar e recriar policies (sem restrição)
DROP POLICY IF EXISTS "Admin can view all associates" ON public.associates;
DROP POLICY IF EXISTS "Anyone can create associate" ON public.associates;
DROP POLICY IF EXISTS "Admin can update associates" ON public.associates;

CREATE POLICY "public_all" ON public.associates FOR ALL USING (true) WITH CHECK (true);

-- 4. Profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;

CREATE POLICY "profiles_public" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
