import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Verifica secret interno
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { disdettaId, recipientEmail, subject, body } = await req.json()

  if (!disdettaId || !recipientEmail || !subject || !body) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.PEC_SMTP_HOST,
    port: Number(process.env.PEC_SMTP_PORT),
    secure: process.env.PEC_SMTP_PORT === '465', // true per Aruba (465), false per Mailtrap (2525/587)
    auth: {
      user: process.env.PEC_SMTP_USER,
      pass: process.env.PEC_SMTP_PASS,
    },
  })

  // Recupera allegati da Supabase Storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: disdetta, error: disdettaError } = await supabase
    .from('disdette')
    .select('pdf_path, delega_con_documento_path')
    .eq('id', disdettaId)
    .single()

  if (disdettaError || !disdetta) {
    console.error('[send-pec-smtp] Disdetta non trovata:', disdettaError)
    return NextResponse.json({ error: 'Disdetta non trovata' }, { status: 404 })
  }

  const attachments: { filename: string; content: Buffer; contentType: string }[] = []

  if (disdetta.pdf_path) {
    const { data } = await supabase.storage
      .from('documenti-disdetta')
      .download(disdetta.pdf_path)
    if (data) {
      attachments.push({
        filename: 'lettera_disdetta.pdf',
        content: Buffer.from(await data.arrayBuffer()),
        contentType: 'application/pdf',
      })
    }
  }

  if (disdetta.delega_con_documento_path) {
    const { data } = await supabase.storage
      .from('documenti-disdetta')
      .download(disdetta.delega_con_documento_path)
    if (data) {
      attachments.push({
        filename: 'delega_con_documento.pdf',
        content: Buffer.from(await data.arrayBuffer()),
        contentType: 'application/pdf',
      })
    }
  }

  console.log(`[send-pec-smtp] Invio a ${recipientEmail}, allegati: ${attachments.length}`)

  try {
    await transporter.sendMail({
      from: `${process.env.PEC_SENDER_NAME} <${process.env.PEC_SENDER_EMAIL}>`,
      to: recipientEmail,
      subject,
      text: body,
      attachments,
    })

    console.log(`[send-pec-smtp] ✅ Email inviata a ${recipientEmail}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[send-pec-smtp] ❌ Errore SMTP:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'SMTP error' },
      { status: 500 }
    )
  }
}
