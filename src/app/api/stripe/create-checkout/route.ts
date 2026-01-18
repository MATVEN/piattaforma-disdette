// src/app/api/stripe/create-checkout/route.ts
 
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/stripe-server';
import { PRICE_CENTS } from '@/lib/stripe/stripe-config';
import { createServerClient } from '@/lib/supabase/server'
import { DISDETTA_STATUS} from '@/types/enums'
 
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
 
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    // Get request body
    const { disdettaId } = await req.json()
    if (!disdettaId) {
      return NextResponse.json({ error: 'Missing disdettaId' }, { status: 400 })
    }
 
    // Verify disdetta exists and belongs to user
    const { data: disdetta, error: disdettaError } = await supabase
      .from('disdette')
      .select('id, status, supplier_name, stripe_session_id')
      .eq('id', disdettaId)
      .eq('user_id', user.id)
      .single()
 
    if (disdettaError || !disdetta) {
      return NextResponse.json({ error: 'Disdetta not found' }, { status: 404 })
    }
 
    // Check if already paid
    if ([DISDETTA_STATUS.CONFIRMED, DISDETTA_STATUS.SENT].includes(disdetta.status)) {
      return NextResponse.json({ error: 'Disdetta already processed' }, { status: 400 })
    }
 
    // IDEMPOTENCY / Reuse existing session if still valid
    if (disdetta.stripe_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(disdetta.stripe_session_id)
 
        // expire check: expires_at may be undefined/null for some sessions — guard it
        const expiresAtMs = existingSession.expires_at ? existingSession.expires_at * 1000 : 0
        if (existingSession.status === 'open' && expiresAtMs > Date.now()) {
          console.log('Reusing existing checkout session:', existingSession.id)
          return NextResponse.json({ 
            sessionId: existingSession.id,
            url: existingSession.url
          })
        }
      } catch (err) {
        console.log('Previous session expired/invalid or retrieval error, creating new one', err)
      }
    }
 
    // Create Stripe Checkout Session.
    // Use a stable idempotency key per disdetta to avoid duplicate sessions on rapid clicks.
    const idempotencyKey = `checkout_${disdettaId}_${user.id}`
 
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Servizio Disdetta DisdEasy',
              description: `Disdetta per ${disdetta.supplier_name || 'operatore'}`,
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/review?id=${disdettaId}&payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/review?id=${disdettaId}&payment_cancelled=true`,
      metadata: {
        disdettaId: disdetta.id.toString(),
        userId: user.id,
      },
      customer_email: user.email,
      locale: 'it',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    }, {
      idempotencyKey,
    })
 
    // Store session ID for idempotency - ignore update errors but log them
    const { error: updateErr } = await supabase
      .from('disdette')
      .update({ stripe_session_id: session.id })
      .eq('id', disdettaId)
 
    if (updateErr) {
      console.warn('Warning: failed to persist stripe_session_id', updateErr)
    }
 
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Impossibile creare la sessione di pagamento. Riprova.' },
      { status: 500 }
    )
  }
}