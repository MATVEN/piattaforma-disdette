import { Resend } from 'resend'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Get Resend client instance (lazy initialization)
 * This prevents build-time errors when API key is not set
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  return new Resend(apiKey)
}

/**
 * Send email using Resend
 * Returns success boolean and messageId
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: 'DisEasy <onboarding@resend.dev>', // Change to your domain in production
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}

/**
 * Email Templates
 */

export function getDisdettaReadyEmail(params: {
  userName: string
  supplierName: string
  disdettaId: number
  reviewUrl: string
}) {
  const { userName, supplierName, disdettaId, reviewUrl } = params

  return {
    subject: '✅ La tua disdetta è pronta per la revisione',
    html: `
<!DOCTYPE html>
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
  </style>
</head>
<body>
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
      <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisEasy.</p>
      <p>
        <a href="https://DisEasy.it/dashboard">Dashboard</a> ·
        <a href="https://DisEasy.it/faq">FAQ</a> ·
        <a href="mailto:support@DisEasy.it">Supporto</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

export function getPecSentEmail(params: {
  userName: string
  supplierName: string
  disdettaId: number
  dashboardUrl: string
}) {
  const { userName, supplierName, disdettaId, dashboardUrl } = params

  return {
    subject: '🎉 PEC di disdetta inviata con successo!',
    html: `
<!DOCTYPE html>
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
  </style>
</head>
<body>
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
        <p>• Il fornitore deve confermare la ricezione entro 30 giorni</p>
        <p>• Ti notificheremo quando riceveremo la conferma</p>
        <p>• Puoi monitorare lo stato nella tua dashboard</p>
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
      <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisEasy.</p>
      <p>
        <a href="https://DisEasy.it/dashboard">Dashboard</a> ·
        <a href="https://DisEasy.it/faq">FAQ</a> ·
        <a href="mailto:support@DisEasy.it">Supporto</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

export function getProcessingErrorEmail(params: {
  userName: string
  supplierName: string | null
  disdettaId: number
  errorMessage: string | null
  uploadUrl: string
}) {
  const { userName, supplierName, disdettaId, errorMessage, uploadUrl } = params

  return {
    subject: '⚠️ Problema con l\'elaborazione della disdetta',
    html: `
<!DOCTYPE html>
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
      margin-left: 12px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Problema Rilevato</h1>
    </div>

    <div class="content">
      <p>Ciao ${userName},</p>

      <p>Purtroppo abbiamo riscontrato un problema durante l'elaborazione della tua disdetta${supplierName ? ` per <strong>${supplierName}</strong>` : ''}.</p>

      <div class="error-box">
        <strong>Dettagli errore:</strong><br>
        ${errorMessage || 'Non è stato possibile estrarre i dati dalla bolletta caricata.'}
      </div>

      <div class="help-box">
        <p><strong>Cosa puoi fare:</strong></p>
        <p>• Ricarica una bolletta più recente e chiara</p>
        <p>• Assicurati che il documento sia leggibile (non sfocato)</p>
        <p>• Verifica che sia in formato PDF, PNG o JPG</p>
        <p>• Se il problema persiste, contatta il supporto</p>
      </div>

      <p>Siamo qui per aiutarti! Se hai bisogno di assistenza, non esitare a contattarci.</p>

      <div class="cta">
        <div>
          <a href="${uploadUrl}" class="button">Ricarica Bolletta →</a>
        </div>
        <div>
          <a href="mailto:support@DisEasy.it" class="button-secondary">Contatta Supporto</a>
        </div>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        <strong>ID Disdetta:</strong> #${disdettaId}
      </p>
    </div>

    <div class="footer">
      <p>Hai ricevuto questa email perché hai richiesto una disdetta su DisEasy.</p>
      <p>
        <a href="https://DisEasy.it/dashboard">Dashboard</a> ·
        <a href="https://DisEasy.it/faq">FAQ</a> ·
        <a href="mailto:support@DisEasy.it">Supporto</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  }
}
