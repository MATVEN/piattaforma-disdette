/**
 * Sistema centralizzato di gestione errori
 * Usato da Services e API Routes per errori type-safe
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Mantiene lo stack trace corretto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// === Errori Comuni ===

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorizzato. Effettua il login.') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accesso negato.') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Risorsa', id?: string | number) {
    const message = id 
      ? `${resource} con id ${id} non trovata.`
      : `${resource} non trovata.`;
    super(404, message, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dati non validi.', details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflitto: la risorsa esiste già.') {
    super(409, message, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Errore del database.', details?: unknown) {
    super(500, message, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message = 'Servizio esterno non disponibile.') {
    super(503, `${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR');
  }
}

// === Helper per API Routes ===

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Converte qualsiasi errore in una Response NextJS
 * Usare nei catch block delle API Routes
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (isAppError(error)) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  // Errore Zod
  if (error && typeof error === 'object' && 'issues' in error) {
    return Response.json(
      { 
        error: 'Validazione fallita', 
        code: 'VALIDATION_ERROR',
        details: (error as any).issues 
      },
      { status: 400 }
    );
  }

  // Errore generico
  return Response.json(
    { 
      error: 'Errore interno del server',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}