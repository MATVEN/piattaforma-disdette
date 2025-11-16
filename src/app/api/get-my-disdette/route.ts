/**
 * API Route: GET /api/get-my-disdette
 * Recupera tutte le disdette dell'utente autenticato con paginazione
 * 
 * Query Parameters:
 * - page: numero pagina (default: 1)
 * - pageSize: elementi per pagina (default: 10, max: 100)
 * 
 * Response:
 * {
 *   data: ExtractedData[],
 *   count: number,
 *   hasMore: boolean
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthService } from "@/services/auth.service";
import { DisdettaService } from "@/services/disdetta.service";
import { DisdettaRepository } from "@/repositories/disdetta.repository";
import { handleApiError } from "@/lib/errors/AppError";

export async function GET(request: NextRequest) {
  try {
    // 1. Setup client e autenticazione
    const supabase = await createServerClient();
    const user = await AuthService.getCurrentUser(supabase);

    // 2. Parse parametri paginazione
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    // 3. Business logic delegata al service
    const repository = new DisdettaRepository(supabase);
    const service = new DisdettaService(repository, user.id);
    
    const result = await service.getMyDisdette(page, pageSize);

    // 4. Response
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}