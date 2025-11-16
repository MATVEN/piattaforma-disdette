/**
 * API Route: PATCH /api/confirm-data
 * Conferma i dati estratti dall'OCR e prepara la disdetta per l'invio
 * 
 * Body:
 * {
 *   id: number,
 *   supplier_tax_id: string,
 *   receiver_tax_id: string,
 *   supplier_iban?: string
 * }
 * 
 * Business Logic:
 * - Valida i dati con Zod
 * - Verifica che lo stato sia PENDING_REVIEW
 * - Aggiorna a stato CONFIRMED
 * - Verifica che i dati essenziali siano presenti
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthService } from "@/services/auth.service";
import { DisdettaService } from "@/services/disdetta.service";
import { DisdettaRepository } from "@/repositories/disdetta.repository";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";

export async function PATCH(request: NextRequest) {
  try {
    // 1. Setup client e autenticazione
    const supabase = await createServerClient();
    const user = await AuthService.getCurrentUser(supabase);

    // 2. Parse body JSON
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Body JSON non valido o mancante");
    }

    // 3. Business logic delegata al service
    // Il service esegue:
    // - Validazione Zod automatica
    // - Controllo stato (deve essere PENDING_REVIEW)
    // - Update database con stato CONFIRMED
    // - Verifica dati essenziali
    const repository = new DisdettaRepository(supabase);
    const service = new DisdettaService(repository, user.id);
    
    const confirmed = await service.confirmAndPrepareForSend(body.id, body);

    // 4. Response
    return NextResponse.json(confirmed);
  } catch (error) {
    return handleApiError(error);
  }
}