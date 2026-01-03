import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    // Message length validation
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Il messaggio deve contenere almeno 10 caratteri' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Il messaggio non può superare i 1000 caratteri' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Insert into database
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'new'
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Errore durante il salvataggio del messaggio' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Messaggio inviato con successo' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
