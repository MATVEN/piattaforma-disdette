/**
 * Auth Service - Centralizza la logica di autenticazione
 * Elimina duplicazione tra API routes
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { UnauthorizedError } from '@/lib/errors/AppError';

export class AuthService {
  /**
   * Ottiene l'utente autenticato corrente
   * Lancia UnauthorizedError se non autenticato
   */
  static async getCurrentUser(supabase: SupabaseClient): Promise<User> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError('Sessione non valida. Effettua nuovamente il login.');
    }

    return user;
  }

  /**
   * Ottiene l'utente autenticato con controllo del profilo completo
   * Utile per route che richiedono profilo completato
   */
  static async getCurrentUserWithProfile(supabase: SupabaseClient) {
    const user = await this.getCurrentUser(supabase);

    // Fetch del profilo
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza, documento_identita_path')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new UnauthorizedError('Impossibile recuperare il profilo utente.');
    }

    // Check completezza profilo
    const isComplete = !!(
      profile?.nome &&
      profile?.cognome &&
      profile?.indirizzo_residenza &&
      profile?.documento_identita_path
    );

    if (!isComplete) {
      throw new UnauthorizedError(
        'Profilo incompleto. Completa il tuo profilo prima di procedere.'
      );
    }

    return { user, profile };
  }

  /**
   * Verifica se l'utente è il proprietario di una risorsa
   * Utile per check di autorizzazione
   */
  static async verifyOwnership(
    supabase: SupabaseClient,
    userId: string,
    resourceUserId: string
  ): Promise<void> {
    if (userId !== resourceUserId) {
      throw new UnauthorizedError('Non hai i permessi per accedere a questa risorsa.');
    }
  }

  /**
   * Helper per refresh del token se necessario
   * Gestisce automaticamente il refresh delle sessioni
   */
  static async ensureValidSession(supabase: SupabaseClient): Promise<void> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new UnauthorizedError('Sessione scaduta. Effettua nuovamente il login.');
    }

    // Il client Supabase gestisce automaticamente il refresh
    // Ma possiamo verificare se la sessione sta per scadere
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      // Se mancano meno di 5 minuti, forza il refresh
      if (timeUntilExpiry < 300) {
        await supabase.auth.refreshSession();
      }
    }
  }
}