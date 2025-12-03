/**
 * Disdetta Repository - Data Access Layer
 * Centralizza tutte le query al database per la tabella extracted_data
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types'
import { NotFoundError, DatabaseError } from '@/lib/errors/AppError';

type ExtractedData = Database['public']['Tables']['extracted_data']['Row'];
type ExtractedDataInsert = Database['public']['Tables']['extracted_data']['Insert'];
type ExtractedDataUpdate = Database['public']['Tables']['extracted_data']['Update'];

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export class DisdettaRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Recupera una singola disdetta per ID e user_id
   * Usa RLS per sicurezza automatica
   */
  async getById(id: number, userId: string): Promise<ExtractedData> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Disdetta', id);
      }
      throw new DatabaseError('Errore recupero disdetta', error);
    }

    return data;
  }

  /**
   * Recupera tutte le disdette di un utente con paginazione
   * Ritorna anche il count totale per UI
   */
  async getByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResult<ExtractedData>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.supabase
      .from('extracted_data')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new DatabaseError('Errore recupero lista disdette', error);
    }

    const hasMore = count ? (page * pageSize) < count : false;

    return {
      data: data || [],
      count: count || 0,
      hasMore,
    };
  }

  /**
   * Recupera una disdetta per file_path (usato dall'OCR dopo upload)
   * Utile per trovare il record creato in fase di upload
   */
  async getByFilePath(filePath: string, userId: string): Promise<ExtractedData | null> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .select('*')
      .eq('file_path', filePath)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Errore recupero disdetta per file_path', error);
    }

    return data;
  }

  /**
   * Crea un nuovo record disdetta (usato in fase di upload)
   */
  async create(data: ExtractedDataInsert): Promise<ExtractedData> {
    const { data: created, error } = await this.supabase
      .from('extracted_data')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Errore creazione disdetta', error);
    }

    return created;
  }

  /**
   * Aggiorna lo status di una disdetta
   * Usato per: PROCESSING -> PENDING_REVIEW -> CONFIRMED -> SENT
   */
  async updateStatus(
    id: number,
    userId: string,
    status: string,
    errorMessage?: string | null
  ): Promise<ExtractedData> {
    const updateData: ExtractedDataUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage !== undefined) {
      updateData.error_message = errorMessage;
    }

    const { data, error } = await this.supabase
      .from('extracted_data')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Disdetta', id);
      }
      throw new DatabaseError('Errore aggiornamento status', error);
    }

    return data;
  }

  /**
   * Conferma i dati estratti dall'OCR
   * Usato nella Review page quando l'utente conferma i dati
   * C23: Supporta tutti i campi B2C e B2B
   */
  async confirmData(
    id: number,
    userId: string,
    confirmedData: {
      // Existing fields
      supplier_tax_id?: string | null;
      receiver_tax_id?: string | null;
      supplier_iban?: string | null;
      supplier_contract_number?: string | null;
      supplier_name?: string | null;
      customer_code?: string | null;
      pod_pdr?: string | null;

      // B2C/B2B discriminator
      tipo_intestatario?: 'privato' | 'azienda' | null;

      // B2C fields
      nome?: string | null;
      cognome?: string | null;
      codice_fiscale?: string | null;
      indirizzo_residenza?: string | null;
      telefono?: string | null;

      // B2B fields
      ragione_sociale?: string | null;
      partita_iva?: string | null;
      sede_legale?: string | null;
      lr_nome?: string | null;
      lr_cognome?: string | null;
      lr_codice_fiscale?: string | null;
      indirizzo_fornitura?: string | null;
      indirizzo_fatturazione?: string | null;
      richiedente_ruolo?: 'legale_rappresentante' | 'delegato' | null;
      visura_camerale_path?: string | null;
      delega_firma_path?: string | null;
    }
  ): Promise<ExtractedData> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .update({
        ...confirmedData,
        status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Disdetta', id);
      }
      throw new DatabaseError('Errore conferma dati', error);
    }

    return data;
  }

  /**
   * Salva il path del PDF generato
   * Usato dopo la generazione della lettera di disdetta
   */
  async savePdfPath(
    id: number,
    userId: string,
    pdfPath: string
  ): Promise<ExtractedData> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .update({
        pdf_path: pdfPath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Disdetta', id);
      }
      throw new DatabaseError('Errore salvataggio PDF path', error);
    }

    return data;
  }

  /**
   * Verifica se una disdetta è in uno stato specifico
   * Utile per validazioni business logic
   */
  async verifyStatus(
    id: number,
    userId: string,
    expectedStatus: string
  ): Promise<boolean> {
    const disdetta = await this.getById(id, userId);
    return disdetta.status === expectedStatus;
  }

  /**
   * Conta le disdette per status (utile per dashboard stats)
   */
  async countByStatus(userId: string): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError('Errore conteggio per status', error);
    }

    // Raggruppa per status
    const counts: Record<string, number> = {};
    data.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });

    return counts;
  }

  /**
   * Controlla se esiste una disdetta duplicata per lo stesso contratto
   * Una disdetta è duplicata se ha stesso user_id, supplier_tax_id, 
   * receiver_tax_id E supplier_contract_number con status attivo
   *
   * @param userId - ID dell'utente
   * @param supplierTaxId - Partita IVA del fornitore
   * @param receiverTaxId - Codice fiscale del destinatario
   * @param supplierContractNumber - Codice univoco contratto (POD/PDR/Cliente)
   * @returns Disdetta esistente se trovata, null altrimenti
   */
  async checkDuplicate(
    userId: string,
    supplierTaxId: string,
    receiverTaxId: string,
    supplierContractNumber: string
  ): Promise<ExtractedData | null> {
    const { data, error } = await this.supabase
      .from('extracted_data')
      .select('*')
      .eq('user_id', userId)
      .eq('supplier_tax_id', supplierTaxId)
      .eq('receiver_tax_id', receiverTaxId)
      .eq('supplier_contract_number', supplierContractNumber)
      .in('status', ['PROCESSING', 'PENDING_REVIEW', 'CONFIRMED', 'SENT', 'TEST_SENT'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Errore nel controllo duplicati', error);
    }

    return data;
  }

  /**
   * Elimina una disdetta (opzionale - se vuoi implementare la funzionalità)
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('extracted_data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError('Errore eliminazione disdetta', error);
    }
  }
}