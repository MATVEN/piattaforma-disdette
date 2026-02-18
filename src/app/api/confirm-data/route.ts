/**
 * API Route: PATCH /api/confirm-data
 * Conferma i dati estratti dall'OCR e prepara la disdetta per l'invio
 *
 * Body:
 * {
 *   id: number,
 *   supplier_tax_id: string,
 *   receiver_tax_id: string,
 *   supplier_iban?: string,
 *   bypassDuplicateCheck?: boolean  // C21: Skip duplicate detection if true
 *   bypassOperatorCheck?: boolean   // Skip operator mismatch warning if true
 * }
 *
 * Business Logic:
 * - Valida i dati con Zod
 * - Verifica che lo stato sia PENDING_REVIEW
 * - Check operator match (fuzzy) - returns warning if mismatch
 * - Check duplicate disdette (C21) - skippabile con bypass flag
 * - Aggiorna a stato CONFIRMED
 * - Verifica che i dati essenziali siano presenti
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthService } from "@/services/auth.service";
import { DisdettaService } from "@/services/disdetta.service";
import { DisdettaRepository } from "@/repositories/disdetta.repository";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";
import * as fuzz from "fuzzball";

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

    // 3. Operator Match Validation (if not bypassed)
    console.log('[CONFIRM] Operator check params:', {
      bypassOperatorCheck: body.bypassOperatorCheck,
      hasId: !!body.id,
      id: body.id
    })

    if (!body.bypassOperatorCheck && body.id) {
      console.log('[CONFIRM] ✅ Entering operator match block')

      // Step 1: Fetch disdetta
      const { data: disdetta, error: fetchError } = await supabase
        .from("disdette")
        .select("supplier_name, file_path")
        .eq("id", body.id)
        .eq("user_id", user.id)
        .single();

      console.log('[CONFIRM] Disdetta fetch result:', {
        hasDisdetta: !!disdetta,
        hasError: !!fetchError,
        error: fetchError?.message,
        disdetta
      })

      if (disdetta?.file_path) {
        
        // Step 2: Extract service_type_id from file_path
        // Format: user_id/service_type_id/timestamp_filename.pdf
        const pathParts = disdetta.file_path.split('/')
        const serviceTypeId = parseInt(pathParts[1], 10)
        console.log('[CONFIRM] Extracted service_type_id from path:', serviceTypeId)

        if (!isNaN(serviceTypeId)) {
          // Step 3: Fetch operator_id from service_types
          const { data: serviceType } = await supabase
            .from("service_types")
            .select("operator_id")
            .eq("id", serviceTypeId)
            .single();
          console.log('[CONFIRM] Service type fetch:', { serviceType })

          if (serviceType?.operator_id) {
            // Step 4: Fetch operator name
            const { data: operator } = await supabase
              .from("operators")
              .select("name")
              .eq("id", serviceType.operator_id)
              .single();
            console.log('[CONFIRM] Operator fetch:', { operator })
            const extractedSupplier = disdetta.supplier_name as string | null;
            const selectedOperator = operator?.name as string | null;
            console.log('[CONFIRM] Extracted values:', {
              extractedSupplier,
              selectedOperator
            })

            if (extractedSupplier && selectedOperator) {
              // Fuzzy match using token_set_ratio (handles partial matches)
              const similarity = fuzz.token_set_ratio(
                extractedSupplier.toLowerCase(),
                selectedOperator.toLowerCase()
              );
              console.log(`[Operator Match] "${extractedSupplier}" vs "${selectedOperator}": ${similarity}%`);

              // If similarity < 60%, warn user
              if (similarity < 60) {
                return NextResponse.json({
                  success: false,
                  warning: "operator_mismatch",
                  data: {
                    extracted_supplier: extractedSupplier,
                    selected_operator: selectedOperator,
                    similarity: similarity,
                  },
                  message: `Hai selezionato "${selectedOperator}" ma la bolletta sembra di "${extractedSupplier}". Vuoi procedere comunque?`,
                }, { status: 200 });
              }
            }
          }
        }
      }
    }

    // 4. Business logic delegata al service
    // Il service esegue:
    // - Validazione Zod automatica
    // - Controllo stato (deve essere PENDING_REVIEW)
    // - Check duplicati (C21) - se non bypassato
    // - Update database con stato CONFIRMED
    // - Verifica dati essenziali
    const repository = new DisdettaRepository(supabase);
    const service = new DisdettaService(repository, user.id);

    const confirmed = await service.confirmAndPrepareForSend(body.id, body);

    // 5. Response
    return NextResponse.json(confirmed);
  } catch (error) {
    return handleApiError(error);
  }
}