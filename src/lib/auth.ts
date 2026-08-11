// Auth utilities - client-side only
// Esta função só pode ser chamada no browser

let supabaseInstance: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

export async function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient só pode ser usado no browser');
  }

  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

export async function logout() {
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}

export async function getCurrentUser() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
