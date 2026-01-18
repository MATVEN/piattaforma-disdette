/**
 * Disdetta Service - Business Logic Layer
 * Implementa le regole di business e orchestrazione
 */

import { DisdettaRepository, PaginatedResult } from '@/repositories/disdetta.repository';
import { AppError, ValidationError } from '@/lib/errors/AppError';
import { confirmDataSchema } from '@/domain/schemas';
import type { z } from 'zod';
import { DISDETTA_STATUS, PAYMENT_STATUS } from '@/types/enums';
import { logger } from '@/lib/logger';

type ConfirmDataInput = z.infer<typeof confirmDataSchema>;

export class DisdettaService {
  constructor(
    private repository: DisdettaRepository,
    private userId: string
  ) {
    // ✅ FIX #1: Validazione userId nel constructor
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new AppError(500, 'Service inizializzato senza userId valido', 'INVALID_INIT')
    }
  }

  /** Helper per validare id numerico */
  private ensureValidId(id: number) {
    if (!Number.isFinite(Number(id)) || Number(id) <= 0) {
      throw new ValidationError('ID non valido');
    }
  }

  /** ✅ FIX #8: Helper per sanitizzare userId nei log (primi 8 caratteri) */
  private sanitizeUserId(userId: string): string {
    return userId.length > 8 ? userId.substring(0, 8) + '***' : userId
  }

  /**
   * Recupera una disdetta per la review
   * Validazioni business: non può essere già inviata
   */
  async getDisdettaForReview(id: number) {
    this.ensureValidId(id);

    let disdetta;
    try {
      disdetta = await this.repository.getById(id, this.userId);
    } catch (err) {
      logger.error('getDisdettaForReview: repository error', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw err;
    }

    // Business logic: verifica che non sia già stata inviata
    if (disdetta.status === DISDETTA_STATUS.SENT) {
      throw new AppError(
        400,
        'Questa disdetta è già stata inviata e non può essere modificata.',
        'ALREADY_SENT'
      );
    }

    // Business logic: se è in errore, mostra il messaggio
    if (disdetta.status === DISDETTA_STATUS.FAILED && disdetta.error_message) {
      return {
        ...disdetta,
        canEdit: false,
        errorInfo: disdetta.error_message,
      };
    }

    // Business logic: se è in processing, indica che bisogna aspettare
    if (disdetta.status === DISDETTA_STATUS.PROCESSING) {
      return {
        ...disdetta,
        canEdit: false,
        isProcessing: true,
      };
    }

    return {
      ...disdetta,
      canEdit: true,
    };
  }

  /**
   * Recupera tutte le disdette dell'utente con paginazione
   */
  async getMyDisdette(page: number = 1, pageSize: number = 10): Promise<PaginatedResult<any>> {
    // Validazione parametri paginazione
    if (page < 1) {
      throw new ValidationError('Il parametro "page" deve essere >= 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new ValidationError('Il parametro "pageSize" deve essere tra 1 e 100');
    }

    return this.repository.getByUser(this.userId, page, pageSize);
  }

  /**
   * Controlla se un errore è una violazione unique constraint 23505
   * Gestisce vari formati wrapper di Supabase/PostgREST
   */
  private isDuplicateKeyError(err: any): boolean {
    // PG nativo
    if (err?.code === '23505') return true
    
    // Wrapper potenziali
    if (err?.original?.code === '23505') return true
    if (err?.details?.code === '23505') return true
    
    // Message-based fallback
    if (err?.message?.includes('ux_disdette_active_unique_contract')) return true
    
    return false
  }

  /**
   * Conferma i dati estratti dall'OCR e prepara per l'invio
   * 
   * ✅ FIX #2: Usa indice unico DB per prevenire duplicati (race-safe)
   * Flow: Tenta update → se unique violation → recupera duplicato per dettagli messaggio
   */
  async confirmAndPrepareForSend(id: number, data: ConfirmDataInput) {
    this.ensureValidId(id);

    // 1. Validazione Zod dei dati in input
    const validated = confirmDataSchema.parse(data);

    // 2. Recupera la disdetta e verifica lo stato
    let disdetta;
    try {
      disdetta = await this.repository.getById(id, this.userId);
    } catch (err) {
      logger.error('confirmAndPrepareForSend: getById failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw err;
    }

    // 3. Business rule: può essere confermata solo se in PENDING_REVIEW
    if (disdetta.status !== DISDETTA_STATUS.PENDING_REVIEW) {
      throw new AppError(
        400,
        `Impossibile confermare: la disdetta è nello stato "${disdetta.status}".`,
        'INVALID_STATUS'
      );
    }

    // 4. Verifica che i dati essenziali siano presenti
    const supplierTaxId = validated.supplier_tax_id || disdetta.supplier_tax_id;
    const receiverTaxId = validated.receiver_tax_id || disdetta.receiver_tax_id;
    const supplierContractNumber = validated.supplier_contract_number || disdetta.supplier_contract_number;

    if (!supplierTaxId || !receiverTaxId) {
      throw new AppError(
        400,
        'Dati incompleti: Codice Fiscale fornitore e destinatario sono obbligatori.',
        'INCOMPLETE_DATA'
      );
    }

    if (!supplierContractNumber) {
      throw new AppError(
        400,
        'Codice contratto mancante: impossibile verificare duplicati. Assicurati che il numero POD/PDR/Cliente sia stato estratto dalla bolletta.',
        'MISSING_CONTRACT_NUMBER'
      );
    }

    try {
      const confirmed = await this.repository.confirmData(id, this.userId, {
        supplier_name: validated.supplier_name || null,
        supplier_tax_id: validated.supplier_tax_id || null,
        receiver_tax_id: validated.receiver_tax_id || null,
        supplier_iban: validated.supplier_iban || null,
        supplier_contract_number: validated.supplier_contract_number || null,
        customer_code: validated.customer_code || null,
        pod_pdr: validated.pod_pdr || null,
        tipo_intestatario: validated.tipo_intestatario || null,
        nome: validated.nome || null,
        cognome: validated.cognome || null,
        codice_fiscale: validated.codice_fiscale || null,
        indirizzo_residenza: validated.indirizzo_residenza || null,
        ragione_sociale: validated.ragione_sociale || null,
        partita_iva: validated.partita_iva || null,
        sede_legale: validated.sede_legale || null,
        lr_nome: validated.lr_nome || null,
        lr_cognome: validated.lr_cognome || null,
        lr_codice_fiscale: validated.lr_codice_fiscale || null,
        indirizzo_fornitura: validated.indirizzo_fornitura || null,
        indirizzo_fatturazione: validated.indirizzo_fatturazione || null,
        richiedente_ruolo: validated.richiedente_ruolo || null,
        visura_camerale_path: validated.visura_camerale_path || null,
        delega_firma_path: validated.delega_firma_path || null,
      });

      logger.info('confirmAndPrepareForSend: data saved', { 
        id, 
        userId: this.sanitizeUserId(this.userId),
        hasB2BData: !!validated.ragione_sociale
      });
      
      return confirmed;

    } catch (err: any) {
      // ✅ FIX #2: Detect unique constraint violation (duplicate contract)
      if (this.isDuplicateKeyError(err)) {
      logger.warn('Duplicate contract detected via unique index', {
        userId: this.sanitizeUserId(this.userId),
        attemptedId: id,
        contractNumber: supplierContractNumber,
        errorCode: err?.code,          // ✅ Debug info
        errorConstraint: err?.constraint
      })

      // Recupera duplicato per dettagli
      let duplicate
      try {
        duplicate = await this.repository.checkDuplicate(
          this.userId,
          supplierTaxId,
          receiverTaxId,
          supplierContractNumber
        )
      } catch (checkErr) {
        logger.error('Failed to fetch duplicate details', { error: checkErr })
      }

      throw new ValidationError(
        `Esiste già una disdetta per questo contratto (${supplierContractNumber})${duplicate ? `. Creata il ${new Date(duplicate.created_at).toLocaleDateString('it-IT')}` : ''}.`,
        {
          duplicateId: duplicate?.id,
          createdAt: duplicate?.created_at,
          status: duplicate?.status,
          contractNumber: supplierContractNumber
        }
      )
    }

    // Altri errori DB
    logger.error('confirmAndPrepareForSend: repository.confirmData failed', { 
      id, 
      userId: this.sanitizeUserId(this.userId),
      errorCode: err?.code,  // ✅ Aiuta debug production
      error: err 
    })
    throw new AppError(500, 'Errore durante la conferma dati', 'DB_ERROR')
  }
}

  /**
   * Prepara una disdetta per l'invio PEC
   * Verifica che sia nello stato corretto e che il pagamento sia stato completato
   */
  async prepareForPecSend(id: number) {
    this.ensureValidId(id);

    let disdetta;
    try {
      disdetta = await this.repository.getById(id, this.userId);
    } catch (err) {
      logger.error('prepareForPecSend: getById failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw err;
    }

    // Business rule: può essere inviata solo se CONFIRMED
    if (disdetta.status !== DISDETTA_STATUS.CONFIRMED) {
      throw new AppError(
        400,
        `Impossibile inviare: la disdetta deve essere confermata (stato attuale: "${disdetta.status}").`,
        'INVALID_STATUS_FOR_SEND'
      );
    }

    // Verifica pagamento completato
    if (disdetta.payment_status !== PAYMENT_STATUS.PAID) {
      throw new AppError(
        402, // Payment Required
        `Pagamento richiesto: completa il pagamento prima di inviare la PEC (stato: "${disdetta.payment_status || PAYMENT_STATUS.PENDING}").`,
        'PAYMENT_REQUIRED'
      );
    }

    // Verifica dati essenziali
    if (!disdetta.supplier_tax_id || !disdetta.receiver_tax_id) {
      throw new AppError(
        400,
        'Dati mancanti: impossibile procedere con l\'invio.',
        'MISSING_REQUIRED_DATA'
      );
    }

    return disdetta;
  }

  /**
   * Aggiorna lo stato dopo l'invio PEC
   * Chiamato dall'API dopo che l'Edge Function ha completato l'invio
   * 
   * Nota: is_test flag è gestito a livello database/UI, non qui.
   * Sia test che prod usano status SENT. Edge Function controlla is_test
   * per decidere se inviare PEC reale o simulare.
   */
  async markAsSent(id: number, pdfPath?: string) {
    this.ensureValidId(id);

    let isConfirmed: boolean;
    try {
      isConfirmed = await this.repository.verifyStatus(id, this.userId, DISDETTA_STATUS.CONFIRMED);
    } catch (err) {
      logger.error('markAsSent: verifyStatus failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw new AppError(500, 'Errore verifica stato', 'DB_ERROR');
    }

    if (!isConfirmed) {
      throw new AppError(
        400,
        'Impossibile marcare come inviata: stato non valido.',
        'INVALID_STATUS'
      );
    }

    // Salva il path del PDF se fornito (non blocchiamo l'operazione se fallisce)
    if (pdfPath) {
      try {
        await this.repository.savePdfPath(id, this.userId, pdfPath);
      } catch (err) {
        logger.warn('markAsSent: failed to save pdf path', { 
          id, 
          userId: this.sanitizeUserId(this.userId), 
          error: err 
        });
      }
    }

    // Sempre SENT (is_test flag distingue test/prod a livello DB)
    try {
      return await this.repository.updateStatus(id, this.userId, DISDETTA_STATUS.SENT);
    } catch (err) {
      logger.error('markAsSent: updateStatus failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw new AppError(500, 'Errore aggiornamento stato', 'DB_ERROR');
    }
  }

  /**
   * Gestisce un errore durante il processing OCR
   * Usato dall'Edge Function process-document
   */
  async markAsFailed(id: number, errorMessage: string) {
    this.ensureValidId(id);
    try {
      return await this.repository.updateStatus(id, this.userId, DISDETTA_STATUS.FAILED, errorMessage);
    } catch (err) {
      logger.error('markAsFailed: updateStatus failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw new AppError(500, 'Errore aggiornamento stato', 'DB_ERROR');
    }
  }

  /**
   * Recupera le statistiche dashboard
   */
  async getDashboardStats() {
    const counts = await this.repository.countByStatus(this.userId);

    return {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      pending: counts[DISDETTA_STATUS.PENDING_REVIEW] || 0,
      confirmed: counts[DISDETTA_STATUS.CONFIRMED] || 0,
      sent: counts[DISDETTA_STATUS.SENT] || 0,
      failed: counts[DISDETTA_STATUS.FAILED] || 0,
      processing: counts[DISDETTA_STATUS.PROCESSING] || 0,
    };
  }

  /**
   * Verifica se l'utente può creare una nuova disdetta
   * (Opzionale: implementa limiti, rate limiting, etc.)
   */
  async canCreateNewDisdetta(): Promise<boolean> {
    const counts = await this.repository.countByStatus(this.userId);
    const processingCount = counts[DISDETTA_STATUS.PROCESSING] || 0;

    if (processingCount >= 10) {
      throw new AppError(
        429,
        'Hai raggiunto il limite di disdette in elaborazione. Attendi il completamento.',
        'TOO_MANY_PROCESSING'
      );
    }

    return true;
  }

  /**
   * Elimina una disdetta (solo se non inviata)
   */
  async deleteDisdetta(id: number) {
    this.ensureValidId(id);

    let disdetta;
    try {
      disdetta = await this.repository.getById(id, this.userId);
    } catch (err) {
      logger.error('deleteDisdetta: getById failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw err;
    }

    // Business rule: non può eliminare se già inviata
    if (disdetta.status === DISDETTA_STATUS.SENT) {
      throw new AppError(
        400,
        'Impossibile eliminare una disdetta già inviata.',
        'CANNOT_DELETE_SENT'
      );
    }

    try {
      await this.repository.delete(id, this.userId);
    } catch (err) {
      logger.error('deleteDisdetta: delete failed', { 
        id, 
        userId: this.sanitizeUserId(this.userId), 
        error: err 
      });
      throw new AppError(500, 'Errore eliminazione disdetta', 'DB_ERROR');
    }

    return { success: true, message: 'Disdetta eliminata con successo' };
  }
}