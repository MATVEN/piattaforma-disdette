// src/lib/email/emailService.ts
import { Resend } from 'resend'

/* ================================== */
/*       Configuration & Security     */
/* ================================== */
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  'https://disdeasy.it'

const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  `DisdEasy <onboarding@${process.env.EMAIL_DOMAIN || 'resend.dev'}>`

/** HTML escape to prevent XSS injection */
function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/** Generate plaintext version from HTML */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim()
}

/* ================================== */
/*          Resend Client             */
/* ================================== */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

/* ================================== */
/*         Send Email Function        */
/* ================================== */
export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  preheader?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  preheader,
}: SendEmailParams) {
  try {
    const resend = getResendClient()
    const fromAddress = from || FROM_EMAIL
    const finalText = text ?? htmlToPlainText(html)

    // ✅ Improved: Use destructured response with error handling
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: finalText,
    })

    if (error) {
      console.error('Resend API error:', error)
      return { success: false, error }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}

/* ================================== */
/*         Email Templates            */
/* ================================== */
export function getDisdettaReadyEmail(params: {
  userName: string
  supplierName: string
  disdettaId: number
  reviewUrl?: string
}) {
  // ✅ SECURITY: Escape all user input
  const userName = escapeHtml(params.userName)
  const supplierName = escapeHtml(params.supplierName)
  const disdettaId = escapeHtml(params.disdettaId)
  const reviewUrl = escapeHtml(
    params.reviewUrl ?? `${BASE_URL}/review?id=${params.disdettaId}`
  )

  const preheader = `La tua disdetta per ${supplierName} è pronta per la revisione.`

  // ✅ IMPROVED: Better UX copy from CODICE2
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        color: white;
        font-size: 28px;
        font-weight: bold;
      }
      .content {
        padding: 32px 24px;
      }
      .content p {
        margin: 0 0 16px 0;
        font-size: 16px;
      }
      .highlight {
        background: #f3f4f6;
        border-left: 4px solid #6366f1;
        padding: 16px;
        margin: 24px 0;
        border-radius: 8px;
      }
      .highlight strong {
        color: #6366f1;
      }
      .cta {
        text-align: center;
        margin: 32px 0;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
        color: white !important;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);
      }
      .footer {
        background: #f9fafb;
        padding: 24px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        margin: 8px 0;
        font-size: 14px;
        color: #6b7280;
      }
      .footer a {
        color: #6366f1;
        text-decoration: none;
      }
      .preheader {
        display: none !important;
        visibility: hidden;
        opacity: 0;
        color: transparent;
        height: 0;
        width: 0;
      }
    </style>
  </head>
  <body>
    <span class="preheader">${escapeHtml(preheader)}</span>
    <div class="container">
      <div class="header">
        <h1>✅ Disdetta Pronta!</h1>
      </div>

      <div class="content">
        <p>Ciao ${userName},</p>

        <p>Buone notizie! La tua disdetta per <strong>${supplierName}</strong> è stata elaborata e ora è pronta per la revisione.</p>

        <div class="highlight">
          <strong>Cosa fare ora?</strong><br>
          Rivedi i dati estratti dalla bolletta, verifica che tutto sia corretto e conferma l'invio della PEC.
        </div>

        <p>Il processo richiede solo pochi minuti e poi la disdetta verrà inviata automaticamente al fornitore tramite PEC certificata.</p>

        <div class="cta">
          <a href="${reviewUrl}" class="button">
            Rivedi e Invia Disdetta →
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
          <strong>ID Disdetta:</strong> #${disdettaId}
        </p>
      </div>

      <div class="footer">
        <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.</p>
        <p>
          <a href="${BASE_URL}/dashboard">Dashboard</a> ·
          <a href="${BASE_URL}/faq">FAQ</a> ·
          <a href="mailto:support@disdeasy.it">Supporto</a>
        </p>
      </div>
    </div>
  </body>
  </html>`

    const text = `Disdetta pronta

  Ciao ${params.userName},

  Buone notizie! La tua disdetta per ${params.supplierName} è stata elaborata e ora è pronta per la revisione.

  Cosa fare ora?
  Rivedi i dati estratti dalla bolletta, verifica che tutto sia corretto e conferma l'invio della PEC.

  Rivedi e Invia: ${reviewUrl}

  ID Disdetta: #${params.disdettaId}

  ---
  Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.
  Dashboard: ${BASE_URL}/dashboard
  FAQ: ${BASE_URL}/faq`

  return {
    subject: '✅ La tua disdetta è pronta per la revisione',
    html,
    text,
    from: FROM_EMAIL,
    preheader,
  }
}

// Payment Confirmation with security and improved UX
export function getPaymentConfirmationEmail(params: {
  userName: string
  disdettaId: number
  supplierName: string
  amount: number
  paymentDate: string
  dashboardUrl?: string
}) {
  // ✅ SECURITY: Escape all inputs
  const userName = escapeHtml(params.userName)
  const disdettaId = escapeHtml(params.disdettaId)
  const supplierName = escapeHtml(params.supplierName)
  const amount = escapeHtml(params.amount.toFixed(2))
  const paymentDate = escapeHtml(params.paymentDate)
  const dashboardUrl = escapeHtml(
    params.dashboardUrl ?? `${BASE_URL}/dashboard`
  )

  const preheader = 'Pagamento confermato. La tua disdetta è ora in lavorazione.'

  // ✅ IMPROVED: Better UX from CODICE2
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .info-box {
      background: #f3f4f6;
      border-left: 4px solid #4f46e5;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 8px 0;
      font-size: 15px;
      color: #374151;
    }
    .info-box strong {
      color: #111827;
      font-weight: 600;
    }
    .next-steps {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .next-steps p {
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    .next-steps ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 6px 0;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
    }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      height: 0;
      width: 0;
    }
  </style>
</head>
<body>
  <span class="preheader">${escapeHtml(preheader)}</span>
  <div class="container">
    <div class="header">
      <h1>✅ Pagamento Confermato!</h1>
    </div>

    <div class="content">
      <p>Ciao <strong>${userName}</strong>,</p>

      <p>Grazie per aver utilizzato DisdEasy! Il tuo pagamento è stato confermato con successo.</p>

      <div class="info-box">
        <p><strong>ID Pratica:</strong> #${disdettaId}</p>
        <p><strong>Destinatario:</strong> ${supplierName}</p>
        <p><strong>Importo:</strong> €${amount}</p>
        <p><strong>Data pagamento:</strong> ${paymentDate}</p>
      </div>

      <div class="next-steps">
        <p><strong>📤 Prossimi Passi</strong></p>
        <p>La tua disdetta sarà elaborata e inviata entro <strong>24 ore lavorative</strong>. Riceverai una notifica quando:</p>
        <ul>
          <li>La disdetta viene inviata al destinatario</li>
          <li>Riceverai la ricevuta di accettazione PEC</li>
        </ul>
      </div>

      <div class="cta">
        <a href="${dashboardUrl}" class="button">
          Vai alla Dashboard →
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
        💡 <strong>Suggerimento:</strong> Conserva questa email come ricevuta del pagamento.
      </p>
    </div>

    <div class="footer">
      <p>Hai domande? Contattaci a <a href="mailto:supporto@disdeasy.it" style="color:#4f46e5;">supporto@disdeasy.it</a></p>
      <p>© ${new Date().getFullYear()} DisdEasy - Tutti i diritti riservati</p>
    </div>
  </div>
</body>
</html>`

  const text = `Pagamento confermato

Ciao ${params.userName},

Grazie per aver utilizzato DisdEasy! Il tuo pagamento è stato confermato con successo.

Dettagli Ordine:
- ID Pratica: #${params.disdettaId}
- Destinatario: ${params.supplierName}
- Importo: €${params.amount.toFixed(2)}
- Data pagamento: ${params.paymentDate}

Prossimi Passi:
La tua disdetta sarà elaborata e inviata entro 24 ore lavorative.

Dashboard: ${dashboardUrl}

Suggerimento: Conserva questa email come ricevuta del pagamento.`

  return {
    subject: '✅ Pagamento confermato - DisdEasy',
    html,
    text,
    from: FROM_EMAIL,
    preheader,
  }
}

/* ================================== */
/*    PEC Sent Email Template         */
/* ================================== */
export function getPecSentEmail(params: {
  userName: string
  supplierName: string
  disdettaId: number
  dashboardUrl?: string
}) {
  // ✅ SECURITY: Escape all user input
  const userName = escapeHtml(params.userName)
  const supplierName = escapeHtml(params.supplierName)
  const disdettaId = escapeHtml(params.disdettaId)
  const dashboardUrl = escapeHtml(
    params.dashboardUrl ?? `${BASE_URL}/dashboard`
  )

  const preheader = `La PEC per la tua disdetta (${supplierName}) è stata inviata con successo.`

  // ✅ IMPROVED: Better UX from CODICE2
  const html = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .success-box strong {
      color: #059669;
    }
    .info-box {
      background: #f3f4f6;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 8px 0;
      font-size: 14px;
    }
    .info-box ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .info-box li {
      margin: 6px 0;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);
    }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
    }
  </style>
  </head>
  <body>
  <span class="preheader">${escapeHtml(preheader)}</span>
  <div class="container">
    <div class="header">
      <h1>🎉 PEC Inviata!</h1>
    </div>

    <div class="content">
      <p>Ciao ${userName},</p>

      <p>Ottima notizia! La PEC di disdetta per <strong>${supplierName}</strong> è stata inviata con successo.</p>

      <div class="success-box">
        <strong>✓ Disdetta ufficialmente inviata</strong><br>
        Il fornitore ha ricevuto la tua richiesta di disdetta tramite PEC certificata con valore legale.
      </div>

      <div class="info-box">
        <p><strong>Cosa succede ora?</strong></p>
        <ul>
          <li>Il fornitore deve confermare la ricezione entro 30 giorni</li>
          <li>Ti notificheremo quando riceveremo la conferma</li>
          <li>Puoi monitorare lo stato nella tua dashboard</li>
        </ul>
      </div>

      <p>Riceverai una copia della PEC inviata via email a breve.</p>

      <div class="cta">
        <a href="${dashboardUrl}" class="button">
          Vai alla Dashboard →
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        <strong>ID Disdetta:</strong> #${disdettaId}
      </p>
    </div>

    <div class="footer">
      <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.</p>
      <p>
        <a href="${BASE_URL}/dashboard">Dashboard</a> ·
        <a href="${BASE_URL}/faq">FAQ</a> ·
        <a href="mailto:support@disdeasy.it">Supporto</a>
      </p>
    </div>
  </div>
  </body>
  </html>`

  const text = `PEC inviata con successo

  Ciao ${params.userName},

  Ottima notizia! La PEC di disdetta per ${params.supplierName} è stata inviata con successo.

  ✓ Disdetta ufficialmente inviata
  Il fornitore ha ricevuto la tua richiesta di disdetta tramite PEC certificata con valore legale.

  Cosa succede ora?
  - Il fornitore deve confermare la ricezione entro 30 giorni
  - Ti notificheremo quando riceveremo la conferma
  - Puoi monitorare lo stato nella tua dashboard

  Riceverai una copia della PEC inviata via email a breve.

  Dashboard: ${dashboardUrl}

  ID Disdetta: #${params.disdettaId}

  ---
  Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.
  Dashboard: ${BASE_URL}/dashboard
  FAQ: ${BASE_URL}/faq
  Supporto: mailto:support@disdeasy.it`

  return {
    subject: '🎉 PEC di disdetta inviata con successo!',
    html,
    text,
    from: FROM_EMAIL,
    preheader,
  }
}

/* ================================== */
/*  Processing Error Email Template   */
/* ================================== */
export function getProcessingErrorEmail(params: {
  userName: string
  supplierName: string | null
  disdettaId: number
  errorMessage: string | null
  uploadUrl?: string
  }) {
  // ✅ SECURITY: Escape all user input
  const userName = escapeHtml(params.userName)
  const supplierName = escapeHtml(params.supplierName)
  const disdettaId = escapeHtml(params.disdettaId)
  const errorMessage = escapeHtml(
    params.errorMessage ??
      'Non è stato possibile estrarre i dati dalla bolletta caricata.'
  )
  const uploadUrl = escapeHtml(
    params.uploadUrl ?? `${BASE_URL}/upload?id=${params.disdettaId}`
  )

  const preheader =
    'Abbiamo riscontrato un problema durante l\'elaborazione della tua disdetta.'

  // ✅ IMPROVED: Better UX from CODICE2
  const html = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .error-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .error-box strong {
      color: #dc2626;
    }
    .help-box {
      background: #f3f4f6;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .help-box p {
      margin: 8px 0;
      font-size: 14px;
    }
    .help-box ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .help-box li {
      margin: 6px 0;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);
      margin: 8px;
    }
    .button-secondary {
      display: inline-block;
      padding: 14px 32px;
      background: white;
      color: #6366f1 !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      border: 2px solid #6366f1;
      margin: 8px;
    }
    .footer {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
    }
  </style>
  </head>
  <body>
  <span class="preheader">${escapeHtml(preheader)}</span>
  <div class="container">
    <div class="header">
      <h1>⚠️ Problema Rilevato</h1>
    </div>

    <div class="content">
      <p>Ciao ${userName},</p>

      <p>Purtroppo abbiamo riscontrato un problema durante l'elaborazione della tua disdetta${
        supplierName ? ` per <strong>${supplierName}</strong>` : ''
      }.</p>

      <div class="error-box">
        <strong>Dettagli errore:</strong><br>
        ${errorMessage}
      </div>

      <div class="help-box">
        <p><strong>Cosa puoi fare:</strong></p>
        <ul>
          <li>Ricarica una bolletta più recente e chiara</li>
          <li>Assicurati che il documento sia leggibile (non sfocato)</li>
          <li>Verifica che sia in formato PDF, PNG o JPG</li>
          <li>Se il problema persiste, contatta il supporto</li>
        </ul>
      </div>

      <p>Siamo qui per aiutarti! Se hai bisogno di assistenza, non esitare a contattarci.</p>

      <div class="cta">
        <a href="${uploadUrl}" class="button">Ricarica Bolletta →</a>
        <a href="mailto:support@disdeasy.it" class="button-secondary">Contatta Supporto</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        <strong>ID Disdetta:</strong> #${disdettaId}
      </p>
    </div>

    <div class="footer">
      <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.</p>
      <p>
        <a href="${BASE_URL}/dashboard">Dashboard</a> ·
        <a href="${BASE_URL}/faq">FAQ</a> ·
        <a href="mailto:support@disdeasy.it">Supporto</a>
      </p>
    </div>
  </div>
  </body>
  </html>`

  const text = `Problema con l'elaborazione della disdetta

  Ciao ${params.userName},

  Purtroppo abbiamo riscontrato un problema durante l'elaborazione della tua disdetta${
    params.supplierName ? ` per ${params.supplierName}` : ''
  }.

  Dettagli errore:
  ${params.errorMessage ?? 'Non è stato possibile estrarre i dati dalla bolletta caricata.'}

  Cosa puoi fare:
  - Ricarica una bolletta più recente e chiara
  - Assicurati che il documento sia leggibile (non sfocato)
  - Verifica che sia in formato PDF, PNG o JPG
  - Se il problema persiste, contatta il supporto

  Ricarica bolletta: ${uploadUrl}
  Supporto: mailto:support@disdeasy.it

  ID Disdetta: #${params.disdettaId}

  ---
  Hai ricevuto questa email perché hai richiesto una disdetta su DisdEasy.
  Dashboard: ${BASE_URL}/dashboard
  FAQ: ${BASE_URL}/faq`

  return {
    subject: "⚠️ Problema con l'elaborazione della disdetta",
    html,
    text,
    from: FROM_EMAIL,
    preheader,
  }
}