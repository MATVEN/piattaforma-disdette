/**
 * API Route: GET /api/get-extracted-data
 * Recupera una singola disdetta per la review page
 * 
 * Query Parameters:
 * - id: ID della disdetta (required, numeric)
 * 
 * Response:
 * {
 *   ...disdettaData,
 *   canEdit: boolean,      // Se può essere modificata
 *   isProcessing?: boolean, // Se è in elaborazione OCR
 *   errorInfo?: string      // Messaggio di errore se FAILED
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthService } from "@/services/auth.service";
import { DisdettaService } from "@/services/disdetta.service";
import { DisdettaRepository } from "@/repositories/disdetta.repository";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";

export async function GET(request: NextRequest) {
  try {
    // 1. Setup client e autenticazione
    const supabase = await createServerClient();
    const user = await AuthService.getCurrentUser(supabase);

    // 2. Parse e valida ID dalla query string
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");
    
    if (!rawId || !/^\d+$/.test(rawId)) {
      throw new ValidationError("Parametro 'id' mancante o non valido");
    }
    
    const id = parseInt(rawId, 10);

    // 3. Business logic delegata al service
    // Il service applica automaticamente controlli sullo stato
    const repository = new DisdettaRepository(supabase);
    const service = new DisdettaService(repository, user.id);
    
    const disdetta = await service.getDisdettaForReview(id);

    // 4. Response con metadata aggiuntivi
    return NextResponse.json(disdetta);
  } catch (error) {
    return handleApiError(error);
  }
}