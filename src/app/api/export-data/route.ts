import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Fetch all user data
    const [profileResult, disdette] = await Promise.all([
      supabase
        .from('profiles')
        .select('nome, cognome, codice_fiscale, indirizzo_residenza')  // ← solo campi necessari
        .eq('user_id', user.id)
        .single(),

      supabase
        .from('disdette')
        .select(`
          id,
          created_at,
          supplier_name,
          status,
          payment_amount,
          sent_at,
          supplier_contract_number
        `)  // ← escluso raw_json_response e altri campi sensibili
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    const profile = profileResult.data
    const disdette_data = disdette.data || []

    // === 1. CREATE PDF WITH PROFILE DATA ===
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 800

    // Title
    page.drawText('I Miei Dati Personali', {
      x: 50,
      y,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })
    y -= 40

    // Export date
    page.drawText(`Esportato il: ${new Date().toLocaleDateString('it-IT')}`, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 30

    // Account info
    page.drawText('ACCOUNT', { x: 50, y, size: 14, font: boldFont })
    y -= 20
    page.drawText(`Email: ${user.email || 'N/D'}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawText(`Creato il: ${new Date(user.created_at || '').toLocaleDateString('it-IT')}`, { x: 50, y, size: 10, font })
    y -= 30

    // Profile info
    page.drawText('PROFILO', { x: 50, y, size: 14, font: boldFont })
    y -= 20
    page.drawText(`Nome: ${profile?.nome || 'N/D'}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawText(`Cognome: ${profile?.cognome || 'N/D'}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawText(`Codice Fiscale: ${profile?.codice_fiscale || 'N/D'}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawText(`Indirizzo: ${profile?.indirizzo_residenza || 'N/D'}`, { x: 50, y, size: 10, font })
    y -= 30

    // Statistics
    page.drawText('STATISTICHE', { x: 50, y, size: 14, font: boldFont })
    y -= 20
    page.drawText(`Totale disdette: ${disdette_data.length}`, { x: 50, y, size: 10, font })
    y -= 15

    const statusCounts = disdette_data.reduce((acc: any, d: any) => {
      acc[d.status] = (acc[d.status] || 0) + 1
      return acc
    }, {})

    for (const [status, count] of Object.entries(statusCounts)) {
      page.drawText(`  - ${status}: ${count}`, { x: 50, y, size: 10, font })
      y -= 15
    }

    const pdfBytes = await pdfDoc.save()

    // === 2. CREATE EXCEL WITH DISDETTE ===
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Le Mie Disdette')

    // Header style
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Data Creazione', key: 'created_at', width: 20 },
      { header: 'Fornitore', key: 'supplier_name', width: 25 },
      { header: 'Stato', key: 'status', width: 20 },
      { header: 'Importo', key: 'payment_amount', width: 12 },
      { header: 'Data Invio PEC', key: 'sent_at', width: 20 },
      { header: 'Numero Contratto', key: 'supplier_contract_number', width: 20 },
    ]

    // Header formatting
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Primary color
    }
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    // Add data
    disdette_data.forEach((d: any) => {
      worksheet.addRow({
        id: d.id,
        created_at: new Date(d.created_at).toLocaleDateString('it-IT'),
        supplier_name: d.supplier_name || 'N/D',
        status: d.status,
        payment_amount: d.payment_amount ? `€${(d.payment_amount / 100).toFixed(2)}` : 'N/D',
        sent_at: d.sent_at ? new Date(d.sent_at).toLocaleDateString('it-IT') : 'N/D',
        supplier_contract_number: d.supplier_contract_number || 'N/D',
      })
    })

    const excelBuffer = await workbook.xlsx.writeBuffer()

    // === 3. CREATE ZIP ===
    const zip = new JSZip()
    zip.file('dati-personali.pdf', pdfBytes)
    zip.file('disdette.xlsx', excelBuffer)

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    // === 4. RETURN ZIP ===
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="DisdEasy-dati-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    })

  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'esportazione' },
      { status: 500 }
    )
  }
}