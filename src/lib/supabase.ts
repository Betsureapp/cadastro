import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipos
export type ApplicationStatus =
  | 'novo_cadastro'
  | 'aguardando_assinatura'
  | 'em_analise'
  | 'aprovado'
  | 'rejeitado';

export type SignatureStatus = 'pendente' | 'assinado' | 'rejeitado';

export type MemberType = 'criador' | 'usuario';

export interface Profile {
  id: string;
  role: 'admin' | 'associate' | 'candidate';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Associate {
  id: string;
  full_name: string;
  birth_date: string | null;
  rg: string | null;
  cpf: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string;
  member_type: MemberType;
  abccmm_registration_number: string | null;
  haras_name: string | null;
  haras_address: string | null;
  haras_city: string | null;
  haras_state: string | null;
  status: ApplicationStatus;
  signature_status: SignatureStatus;
  terms_accepted_at: string | null;
  terms_accepted_ip: string | null;
  terms_accepted_user_agent: string | null;
  referred_by: string | null;
  referral_code: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export const statusLabels: Record<ApplicationStatus, string> = {
  novo_cadastro: 'Novo Cadastro',
  aguardando_assinatura: 'Aguardando Assinatura',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

// Lazy singleton - só cria o cliente quando necessário (no browser)
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}
