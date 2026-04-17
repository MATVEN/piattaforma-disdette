/**
 * API Route: POST /api/send-pec
 * Invia una disdetta confermata tramite PEC
 * 
 * Body:
 * {
 *   id: number  // ID della disdetta da inviare
 * }
 * 
 * Workflow:
 * 1. Verifica autenticazione
 * 2. Verifica che la disdetta sia in stato CONFIRMED
 * 3. Chiama l'Edge Function send-pec-disdetta
 * 4. Se successo, aggiorna lo stato a TEST_SENT
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   pdfPath?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthService } from "@/services/auth.service";
import { DisdettaService } from "@/services/disdetta.service";
import { DisdettaRepository } from "@/repositories/disdetta.repository";
import { handleApiError, ValidationError, ExternalServiceError, UnauthorizedError } from "@/lib/errors/AppError";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Setup client e autenticazione
    const supabase = await createServerClient();
    const user = await AuthService.getCurrentUser(supabase);

    // 2. Rate limiting: max 3 PEC sends per hour per user
    const { allowed, resetAt } = checkRateLimit(
      `send-pec:${user.id}`,
      3,
      60 * 60 * 1000
    )

    if (!allowed) {
      const retryAfterSeconds = resetAt ? Math.ceil((resetAt - Date.now()) / 1000) : 3600
      return NextResponse.json(
        { error: 'Limite invii raggiunto. Riprova tra 1 ora.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // 3. Parse body JSON
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Body JSON non valido o mancante");
    }

    const { id, allegaBolletta = false } = body;
    if (!id || typeof id !== "number") {
      throw new ValidationError("Parametro 'id' mancante o non valido");
    }

    // 3. Verifica che la disdetta sia pronta per l'invio
    // Il service controlla:
    // - Disdetta esiste e appartiene all'utente
    // - Stato è CONFIRMED
    // - Dati essenziali presenti
    const repository = new DisdettaRepository(supabase);
    const service = new DisdettaService(repository, user.id);
    
    const disdetta = await service.prepareForPecSend(id);

    // 4. Chiama l'Edge Function send-pec-disdetta
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-pec-disdetta`;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Validate session exists and matches already-verified user
    if (sessionError || !session || session.user.id !== user.id) {
      throw new UnauthorizedError("Sessione non valida");
    }

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`, // Token utente, non ANON_KEY!
      },
      body: JSON.stringify({ id: id, allegaBolletta }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ExternalServiceError(
        "Edge Function send-pec-disdetta",
        errorData.error || "Errore durante l'invio della PEC"
      );
    }

    const result = await response.json();

    // 5. Response
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}