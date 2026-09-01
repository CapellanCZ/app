import { supabase } from '@/lib/supabase';

let intentionalSignOutPending = false;

/** Consumed by AuthProvider when processing SIGNED_OUT. */
export function consumeIntentionalSignOut(): boolean {
  if (!intentionalSignOutPending) return false;
  intentionalSignOutPending = false;
  return true;
}

/** Sign out everywhere and clear local session. Use for logout buttons. */
export async function signOutUser(): Promise<void> {
  if (!supabase) return;

  intentionalSignOutPending = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    intentionalSignOutPending = false;
  }
}
