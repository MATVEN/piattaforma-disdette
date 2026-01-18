// src/lib/stripe/stripe-config.ts

/**
 * Costanti di prezzo e mappa messaggi.
 * Questi valori sono safe per essere importati sia client che server.
 */
export const PRICE_CENTS = parseInt(
  process.env.STRIPE_PRICE_CENTS || '699',
  10
);

export const PRICE_EUROS = PRICE_CENTS / 100;

/**
 * Format price for display (basic).
 * If you need localization, replace with Intl.NumberFormat.
 */
export const formatPriceEuros = (cents: number) =>
  (cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';

export const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'La tua carta è stata rifiutata. Riprova con un\'altra carta.',
  insufficient_funds: 'Fondi insufficienti sulla carta.',
  expired_card: 'La carta è scaduta.',
  incorrect_cvc: 'Il codice CVC non è corretto.',
  processing_error: 'Errore durante l\'elaborazione. Riprova tra qualche minuto.',
  invalid_number: 'Il numero della carta non è valido.',
  generic_decline: 'Pagamento rifiutato. Contatta la tua banca.',
  default: 'Errore nel pagamento. Riprova o contatta il supporto.',
};