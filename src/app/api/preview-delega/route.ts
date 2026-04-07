import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const dynamic = 'force-dynamic'

interface ProfileData {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
}

async function creaPdfDelega(profile: ProfileData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 portrait in points (approx.)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  const margin = {
    left: 48,
    right: 48,
    top: 48,
    bottom: 48,
  };

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let size = page.getSize();
  let width = size.width;
  let height = size.height;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;

  // Testo con newline per i paragrafi (NON HTML)
  const testo = `
    DELEGA PER INVIO DISDETTA

    Io sottoscritto ${profile.nome || ''} ${profile.cognome || ''}, residente in ${profile.indirizzo_residenza || ''},

    Dichiaro sotto la mia esclusiva responsabilità di essere il titolare del contratto/utenza oggetto della presente richiesta, e autorizzo DisdEasy ad inviare, in mio nome e per mio conto, la comunicazione di disdetta/diffida/ricorso al gestore indicato. 
    Dichiaro che i dati forniti sono veritieri e mi assumo ogni responsabilità civile e penale in caso di false dichiarazioni.

    Data: ${new Date().toLocaleDateString('it-IT')}
  `.trim();

  // Wrap: split in paragrafi e avvolgi ogni paragrafo a linee che rispettino la larghezza
  let maxLineWidth = width - margin.left - margin.right;
  const paragraphs = testo.split(/\n{2,}/); // split sui paragrafi (2+ newline)
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      lines.push(''); // paragrafo vuoto -> riga vuota
      continue;
    }

    const words = trimmedPara.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testLineWidth <= maxLineWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);

        // se una singola parola è più larga del max, spezzala
        if (font.widthOfTextAtSize(word, fontSize) > maxLineWidth) {
          let chunk = '';
          for (const ch of word) {
            const testChunk = chunk + ch;
            if (font.widthOfTextAtSize(testChunk, fontSize) <= maxLineWidth) {
              chunk = testChunk;
            } else {
              lines.push(chunk);
              chunk = ch;
            }
          }
          if (chunk) currentLine = chunk;
          else currentLine = '';
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) lines.push(currentLine);

    lines.push('');
  }

  // Disegna le linee, creando nuove pagine quando necessario
  let cursorY = height - margin.top; // start from top margin
  for (const line of lines) {
    if (cursorY - lineHeight < margin.bottom) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      size = page.getSize();
      width = size.width;
      height = size.height;
      maxLineWidth = width - margin.left - margin.right;
      cursorY = height - margin.top;
    }

    // disegna riga (se vuota, non verrà mostrata ma avanzheremo il cursore)
    if (line) {
      page.drawText(line, {
        x: margin.left,
        y: cursorY - fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    cursorY -= lineHeight;
  }

  return await pdfDoc.save();
}

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 })
    }

    // Generate PDF
    const pdfBytes = await creaPdfDelega(profile)

    // Return PDF (convert Uint8Array to Buffer for NextResponse)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="delega_preview.pdf"',
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch (error) {
    console.error('[Preview Delega] Error:', error)
    return NextResponse.json(
      { error: 'Errore generazione preview' },
      { status: 500 }
    )
  }
}