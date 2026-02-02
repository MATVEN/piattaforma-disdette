// src/app/api/download-documentation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

export const maxDuration = 30 // Vercel timeout

interface FileToDownload {
    path: string
    name: string
    bucket: string
}

const MAX_ZIP_SIZE = 50 * 1024 * 1024 // 50MB

function safeFilenamePart(name: string) {
 return name
   .normalize('NFKD')
   .replace(/[^\x20-\x7E]/g, '_')
   .replace(/\s+/g, '_')
   .replace(/[\/\\?%*:|"<>]/g, '_')
   .replace(/__+/g, '_')
   .toLowerCase()
   .slice(0, 120)
}

export async function GET(request: NextRequest) {
    try {

        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const disdettaId = searchParams.get('id')

        if (!disdettaId) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
        }

        console.log(`[Download] User ${user.id} requesting disdetta ${disdettaId}`)

        // SIMPLE QUERY - No joins
        const { data: disdetta, error: disdettaError } = await supabase
            .from('disdette')
            .select('*')
            .eq('id', Number(disdettaId))
            .eq('user_id', user.id)
            .single()

        console.log('[Download] Found:', !!disdetta, 'Error:', disdettaError?.message)

        if (disdettaError || !disdetta) {
            return NextResponse.json({
            error: 'Disdetta non trovata',
            debug: { disdettaId, error: disdettaError?.message }
            }, { status: 404 })
        }

        // Log what we found
        console.log('[Download] Available paths:', {
            file_path: !!disdetta.file_path,
            pdf_path: !!disdetta.pdf_path,
            delega_firma_path: !!disdetta.delega_firma_path,
            visura: !!disdetta.visura_camerale_path,
            doc_lr: !!disdetta.documento_lr_path
        })

        // Collect all file paths with their correct buckets
        const filePaths: FileToDownload[] = []

        // Lettera disdetta - bucket: documenti-disdetta
        if (disdetta.pdf_path) {
            filePaths.push({ 
            path: disdetta.pdf_path, 
            name: 'lettera_disdetta.pdf',
            bucket: 'documenti-disdetta'
            })
        } else if (disdetta.file_path) {
            filePaths.push({ 
                path: disdetta.file_path, 
                name: 'documento_originale.pdf',
                bucket: 'documenti_utente'
            })
        }

        // Delega con documento identità (B2C sempre, B2B solo se delegato)
        if (disdetta.delega_con_documento_path) {
            filePaths.push({
                path: disdetta.delega_con_documento_path,
                name: 'delega_con_documento_identita.pdf',
                bucket: 'documenti-disdetta'
            })
        }

        // Delega B2B - bucket: documenti-delega
        if (disdetta.delega_firma_path) {
            filePaths.push({ 
                path: disdetta.delega_firma_path, 
                name: 'delega_b2b.pdf',
                bucket: 'documenti-delega'
            })
        }

        // Visura camerale - bucket: documenti-identita
        if (disdetta.visura_camerale_path) {
            filePaths.push({ 
                path: disdetta.visura_camerale_path, 
                name: 'visura_camerale.pdf',
                bucket: 'documenti-identita'
            })
        }

        // Documento LR - bucket: documenti-identita
        if (disdetta.documento_lr_path) {
            filePaths.push({ 
                path: disdetta.documento_lr_path, 
                name: 'documento_legale_rappresentante.pdf',
                bucket: 'documenti-identita'
            })
        }

        if (filePaths.length === 0) {
            return NextResponse.json({ error: 'Nessun documento disponibile' }, { status: 404 })
        }

        console.log(`[Download] Will download ${filePaths.length} files from multiple buckets`)

        // Create ZIP
        const zip = new JSZip()

        // Download all files using correct buckets
        for (const file of filePaths) {
            try {
                console.log(`[Download] Bucket: "${file.bucket}", Path: ${file.path}`)
                
                // Create signed URL from correct bucket
                const { data: urlData, error: urlError } = await supabase
                    .storage
                    .from(file.bucket)  // Usa bucket specifico per ogni file
                    .createSignedUrl(file.path, 60)
                
                if (urlError || !urlData?.signedUrl) {
                    console.error(`[Download] URL failed for ${file.name}:`, urlError?.message)
                    continue
                }
                
                // Fetch file content
                const response = await fetch(urlData.signedUrl)
                
                if (!response.ok) {
                    console.error(`[Download] HTTP ${response.status} for ${file.name}`)
                    continue
                }
                
                const arrayBuffer = await response.arrayBuffer()
                console.log(`[Download] ✓ ${file.name} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`)
                
                zip.file(file.name, arrayBuffer)
            
            } catch (err) {
                console.error(`[Download] Exception for ${file.name}:`, err)
            }
        }

        // Check if any files were added
        const zipFiles = Object.keys(zip.files)
        if (zipFiles.length === 0) {
            console.error(`[Download] No files could be downloaded`)
            return NextResponse.json({ error: 'Impossibile scaricare i documenti' }, { status: 500 })
        }

        console.log(`[Download] ZIP created with ${zipFiles.length} files`)

        // Generate ZIP as Blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        })

        // Create filename safely
        const operatorName = disdetta.operators?.name || 'operatore'
        const createdAt = disdetta.created_at ? new Date(disdetta.created_at) : new Date()
        const date = isNaN(createdAt.getTime())
            ? new Date().toLocaleDateString('it-IT').replace(/\//g, '-')
            : createdAt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')

        const prettyFilename = `disdetta_${operatorName.toLowerCase().replace(/\s+/g, '_')}_${date}.zip`
        const asciiFilename = safeFilenamePart(prettyFilename)
        const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(prettyFilename)}`

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/zip',
            'Content-Disposition': contentDisposition,
            'Cache-Control': 'no-store'
        }

        if (typeof (zipBlob as any).size === 'number') {
            headers['Content-Length'] = String((zipBlob as any).size)
        }

        return new NextResponse(zipBlob, { headers })

    } catch (error) {
        console.error('[Download Docs] Error:', error)
        return NextResponse.json(
            { error: 'Errore durante la generazione del download' },
            { status: 500 }
        )
    }
}