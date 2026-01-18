/**
 * Disdetta Repository - Data Access Layer
 * Centralizza tutte le query al database per la tabella disdette
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types'
import { NotFoundError, DatabaseError } from '@/lib/errors/AppError';
import { DISDETTA_STATUS, PAYMENT_STATUS, type DisdettaStatus } from '@/types/enums'
import { logger } from '@/lib/logger'

type ExtractedData = Database['public']['Tables']['disdette']['Row'];
type ExtractedDataInsert = Database['public']['Tables']['disdette']['Insert'];
type ExtractedDataUpdate = Database['public']['Tables']['disdette']['Update'];

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export class DisdettaRepository {
  private rpcAvailable: boolean | null = null // Cache RPC availability

  constructor(private supabase: SupabaseClient) {}

  /** Utility: runtime check for finite numeric id */
  private ensureValidId(id: number): void {
    if (!Number.isFinite(Number(id)) || id <= 0) {
      throw new DatabaseError('ID non valido')
    }
  }

  /** Utility: runtime check for non-empty userId */
  private ensureValidUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new DatabaseError('userId mancante o non valido')
    }
  }

  /**
   * Recupera una singola disdetta per ID e user_id
   * Usa RLS per sicurezza automatica
   */
  async getById(id: number, userId: string): Promise<ExtractedData> {
    this.ensureValidId(id)
    this.ensureValidUserId(userId)

    const { data, error } = await this.supabase
      .from('disdette')
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
    this.ensureValidUserId(userId)

    // sanitize inputs
    const safePage = Number.isFinite(Number(page)) && page > 0 ? Math.floor(page) : 1
    const safePageSize = Number.isFinite(Number(pageSize))
      ? Math.min(Math.max(Math.floor(pageSize), 1), 100) // clamp 1..100
      : 10

    const from = (safePage - 1) * safePageSize
    const to = from + safePageSize - 1

    const { data, error, count } = await this.supabase
      .from('disdette')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new DatabaseError('Errore recupero lista disdette', error)
    }

    const hasMore = count ? (safePage * safePageSize) < count : false

    return {
      data: data || [],
      count: count || 0,
      hasMore,
    }
  }

  /**
   * Recupera una disdetta per file_path (usato dall'OCR dopo upload)
   * Utile per trovare il record creato in fase di upload
   */
  async getByFilePath(filePath: string, userId: string): Promise<ExtractedData | null> {
    this.ensureValidUserId(userId)
    if (!filePath || typeof filePath !== 'string') {
      throw new DatabaseError('filePath mancante o non valido')
    }

    const { data, error } = await this.supabase
      .from('disdette')
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
    if (!data || typeof data !== 'object') {
      throw new DatabaseError('Dati di creazione non validi')
    }
    if (!('user_id' in data) || !data.user_id) {
      throw new DatabaseError('user_id obbligatorio per creare una disdetta')
    }
    if (!('file_path' in data) || !data.file_path) {
      throw new DatabaseError('file_path obbligatorio per creare una disdetta')
    }

    logger.info('Repository.create', {
      userId: data.user_id,
      filePath: data.file_path,
      status: data.status
    })

    // ✅ Rimuovi status dall'oggetto - usa DEFAULT del database
    const { status, ...dataWithoutStatus } = data;

    const { data: created, error } = await this.supabase
      .from('disdette')
      .insert(dataWithoutStatus)  // ✅ Senza status
      .select()
      .single();

    if (error) {
      logger.error('Repository.create failed', { data, error })
      throw new DatabaseError('Errore creazione disdetta', error);
    }

    logger.info('Repository.create success', { id: created.id })
    return created;
  }

  /**
   * Aggiorna lo status di una disdetta
   * Usato per: PROCESSING -> PENDING_REVIEW -> CONFIRMED -> SENT
   */
  async updateStatus(
    id: number,
    userId: string,
    status: DisdettaStatus,
    errorMessage?: string | null
  ): Promise<ExtractedData> {
    this.ensureValidId(id)
    this.ensureValidUserId(userId)

    logger.info('Repository.updateStatus', { id, userId, status, errorMessage })

    const updateData: ExtractedDataUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage !== undefined) {
      updateData.error_message = errorMessage;
    }

    const { data, error } = await this.supabase
      .from('disdette')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Repository.updateStatus failed', { id, userId, status, error })
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Disdetta', id);
      }
      throw new DatabaseError('Errore aggiornamento status', error);
    }

    logger.info('Repository.updateStatus success', { id, newStatus: data.status })
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
    this.ensureValidId(id)
    this.ensureValidUserId(userId)

    logger.info('Repository.confirmData', { 
      id, 
      userId, 
      hasB2BData: !!confirmedData.ragione_sociale 
    })

    // Phase 2: Save data without changing status to CONFIRMED
    // Status will be set to CONFIRMED by webhook after payment
    const { data, error } = await this.supabase
      .from('disdette')
      .update({
        ...confirmedData,
        status: DISDETTA_STATUS.PENDING_PAYMENT,
        payment_status: PAYMENT_STATUS.PENDING,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Repository.confirmData failed', { id, userId, error })
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
    this.ensureValidId(id)
    this.ensureValidUserId(userId)

    if (!pdfPath || typeof pdfPath !== 'string') {
      throw new DatabaseError('pdfPath non valido')
    }

    const { data, error } = await this.supabase
      .from('disdette')
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
    expectedStatus: DisdettaStatus
  ): Promise<boolean> {
    if (!Number.isFinite(Number(id))) return false
    if (!userId) return false

    const { data, error } = await this.supabase
      .from('disdette')
      .select('status')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new DatabaseError('Errore verifica status', error)
    }

    if (!data) return false
    return data.status === expectedStatus
  }

  /**
   * Conta le disdette per status con RPC optimization
   * Prova prima ad usare una RPC server-side (più efficiente).
   * Se la RPC non esiste, ricade su una soluzione client-side.
   */
  async countByStatus(userId: string): Promise<Record<string, number>> {
    this.ensureValidUserId(userId)

    // Try RPC first (cached check)
    if (this.rpcAvailable !== false) {
      try {
        const { data: rpcData, error: rpcError } = await this.supabase
          .rpc('disdette_count_by_status', { p_user_id: userId })

        if (!rpcError && Array.isArray(rpcData)) {
          this.rpcAvailable = true
          const counts: Record<string, number> = {}
          rpcData.forEach((row: { status: string; cnt: number }) => {
            counts[row.status] = row.cnt
          })
          return counts
        } else {
          logger.warn('RPC disdette_count_by_status failed or returned unexpected shape', {
            userId,
            error: rpcError,
            dataType: typeof rpcData,
            isArray: Array.isArray(rpcData)
          })
        }
      } catch (rpcEx) {
        this.rpcAvailable = false
        logger.warn('RPC disdette_count_by_status threw exception', { 
          userId, 
          error: rpcEx 
        })
      }
    }

    // Fallback: client-side aggregation
    const { data, error } = await this.supabase
      .from('disdette')
      .select('status')
      .eq('user_id', userId)

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
    this.ensureValidUserId(userId)
    if (!supplierTaxId || !receiverTaxId || !supplierContractNumber) {
      return null
    }

    const { data, error } = await this.supabase
      .from('disdette')
      .select('*')
      .eq('user_id', userId)
      .eq('supplier_tax_id', supplierTaxId)
      .eq('receiver_tax_id', receiverTaxId)
      .eq('supplier_contract_number', supplierContractNumber)
      .in('status', [
        DISDETTA_STATUS.PROCESSING, 
        DISDETTA_STATUS.PENDING_REVIEW,
        DISDETTA_STATUS.PENDING_PAYMENT, 
        DISDETTA_STATUS.CONFIRMED, 
        DISDETTA_STATUS.SENT
      ])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Repository.checkDuplicate failed', { userId, error })
      throw new DatabaseError('Errore nel controllo duplicati', error);
    }

    if (data) {
      logger.warn('Duplicate disdetta detected', {
        existingId: data.id,
        userId,
        supplierTaxId,
        contractNumber: supplierContractNumber
      })
    }

    return data;
  }

  /**
  * Elimina una disdetta (opzionale - se vuoi implementare la funzionalità)
  */
  async delete(id: number, userId: string): Promise<void> {
    this.ensureValidId(id)
    this.ensureValidUserId(userId)

    const { error, count } = await this.supabase
      .from('disdette')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new DatabaseError('Errore eliminazione disdetta', error);
    }
  }
}