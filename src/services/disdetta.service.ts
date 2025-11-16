/**
 * Disdetta Service - Business Logic Layer
 * Implementa le regole di business e orchestrazione
 */

import { DisdettaRepository, PaginatedResult } from '@/repositories/disdetta.repository';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/AppError';
import { confirmDataSchema } from '@/domain/schemas';
import type { z } from 'zod';

type ConfirmDataInput = z.infer<typeof confirmDataSchema>;

export class DisdettaService {
  constructor(
    private repository: DisdettaRepository,
    private userId: string
  ) {}

  /**
   * Recupera una disdetta per la review
   * Validazioni business: non può essere già inviata
   */
  async getDisdettaForReview(id: number) {
    const disdetta = await this.repository.getById(id, this.userId);

    // Business logic: verifica che non sia già stata inviata
    if (disdetta.status === 'SENT' || disdetta.status === 'TEST_SENT') {
      throw new AppError(
        400,
        'Questa disdetta è già stata inviata e non può essere modificata.',
        'ALREADY_SENT'
      );
    }

    // Business logic: se è in errore, mostra il messaggio
    if (disdetta.status === 'FAILED' && disdetta.error_message) {
      return {
        ...disdetta,
        canEdit: false,
        errorInfo: disdetta.error_message,
      };
    }

    // Business logic: se è in processing, indica che bisogna aspettare
    if (disdetta.status === 'PROCESSING') {
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
   * Conferma i dati estratti dall'OCR e prepara per l'invio
   * Implementa validazioni Zod + business rules
   */
  async confirmAndPrepareForSend(id: number, data: ConfirmDataInput) {
    // 1. Validazione Zod dei dati in input
    const validated = confirmDataSchema.parse(data);

    // 2. Recupera la disdetta e verifica lo stato
    const disdetta = await this.repository.getById(id, this.userId);

    // Business rule: può essere confermata solo se in PENDING_REVIEW
    if (disdetta.status !== 'PENDING_REVIEW') {
      throw new AppError(
        400,
        `Impossibile confermare: la disdetta è nello stato "${disdetta.status}".`,
        'INVALID_STATUS'
      );
    }

    // 3. Conferma i dati nel database
    const confirmed = await this.repository.confirmData(id, this.userId, {
      supplier_tax_id: validated.supplier_tax_id || null,
      receiver_tax_id: validated.receiver_tax_id || null,
      supplier_iban: validated.supplier_iban || null,
    });

    // 4. Verifica che i dati essenziali siano presenti
    if (!confirmed.supplier_tax_id || !confirmed.receiver_tax_id) {
      throw new AppError(
        400,
        'Dati incompleti: Codice Fiscale fornitore e destinatario sono obbligatori.',
        'INCOMPLETE_DATA'
      );
    }

    return confirmed;
  }

  /**
   * Prepara una disdetta per l'invio PEC
   * Verifica che sia nello stato corretto
   */
  async prepareForPecSend(id: number) {
    const disdetta = await this.repository.getById(id, this.userId);

    // Business rule: può essere inviata solo se CONFIRMED
    if (disdetta.status !== 'CONFIRMED') {
      throw new AppError(
        400,
        `Impossibile inviare: la disdetta deve essere confermata (stato attuale: "${disdetta.status}").`,
        'INVALID_STATUS_FOR_SEND'
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
   */
  async markAsSent(id: number, pdfPath?: string) {
    // Verifica che sia in stato CONFIRMED
    const isConfirmed = await this.repository.verifyStatus(id, this.userId, 'CONFIRMED');
    
    if (!isConfirmed) {
      throw new AppError(
        400,
        'Impossibile marcare come inviata: stato non valido.',
        'INVALID_STATUS'
      );
    }

    // Salva il path del PDF se fornito
    if (pdfPath) {
      await this.repository.savePdfPath(id, this.userId, pdfPath);
    }

    // Aggiorna lo stato
    return this.repository.updateStatus(id, this.userId, 'TEST_SENT');
  }

  /**
   * Gestisce un errore durante il processing OCR
   * Usato dall'Edge Function process-document
   */
  async markAsFailed(id: number, errorMessage: string) {
    return this.repository.updateStatus(id, this.userId, 'FAILED', errorMessage);
  }

  /**
   * Recupera le statistiche dashboard
   */
  async getDashboardStats() {
    const counts = await this.repository.countByStatus(this.userId);

    return {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      pending: counts['PENDING_REVIEW'] || 0,
      confirmed: counts['CONFIRMED'] || 0,
      sent: (counts['SENT'] || 0) + (counts['TEST_SENT'] || 0),
      failed: counts['FAILED'] || 0,
      processing: counts['PROCESSING'] || 0,
    };
  }

  /**
   * Verifica se l'utente può creare una nuova disdetta
   * (Opzionale: implementa limiti, rate limiting, etc.)
   */
  async canCreateNewDisdetta(): Promise<boolean> {
    // Business rule esempio: max 10 disdette in PROCESSING contemporaneamente
    const counts = await this.repository.countByStatus(this.userId);
    const processingCount = counts['PROCESSING'] || 0;

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
    const disdetta = await this.repository.getById(id, this.userId);

    // Business rule: non può eliminare se già inviata
    if (disdetta.status === 'SENT' || disdetta.status === 'TEST_SENT') {
      throw new AppError(
        400,
        'Impossibile eliminare una disdetta già inviata.',
        'CANNOT_DELETE_SENT'
      );
    }

    await this.repository.delete(id, this.userId);

    return { success: true, message: 'Disdetta eliminata con successo' };
  }
}