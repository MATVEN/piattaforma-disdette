// src/app/api/stripe/create-payment-intent/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/stripe-server'
import { PRICE_CENTS } from '@/lib/stripe/stripe-config'
import { createServerClient } from '@/lib/supabase/server'
import { DISDETTA_STATUS } from '@/types/enums'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { disdettaId, paymentIntentId: verifyIntentId } = body

    if (!disdettaId) {
      return NextResponse.json({ error: 'Missing disdettaId' }, { status: 400 })
    }

    // Verify disdetta exists and belongs to user
    const { data: disdetta, error: disdettaError } = await supabase
      .from('disdette')
      .select('id, status, supplier_name, stripe_payment_intent')
      .eq('id', disdettaId)
      .eq('user_id', user.id)
      .single()

    if (disdettaError || !disdetta) {
      return NextResponse.json({ error: 'Disdetta not found' }, { status: 404 })
    }

    // === VERIFY MODE: confirm a completed payment and update DB ===
    if (verifyIntentId) {
      if (disdetta.stripe_payment_intent !== verifyIntentId) {
        return NextResponse.json({ error: 'Payment intent mismatch' }, { status: 400 })
      }

      const pi = await stripe.paymentIntents.retrieve(verifyIntentId)

      if (pi.status !== 'succeeded') {
        return NextResponse.json(
          { ok: false, error: 'Pagamento non completato', status: pi.status },
          { status: 400 }
        )
      }

      // Verify metadata matches
      if (pi.metadata.userId !== user.id || pi.metadata.disdettaId !== disdettaId.toString()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // Update disdetta to CONFIRMED
      const { error: updateError } = await supabase
        .from('disdette')
        .update({
          status: DISDETTA_STATUS.CONFIRMED,
          payment_status: 'PAID',
          payment_amount: pi.amount,
          payment_currency: pi.currency,
          payment_date: new Date().toISOString(),
          payment_method: pi.payment_method_types?.[0] || 'card',
          updated_at: new Date().toISOString(),
        })
        .eq('id', disdettaId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update disdetta after payment:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, paid: true })
    }

    // === CREATE MODE: create a new Payment Intent ===

    // Check if already paid
    if ([DISDETTA_STATUS.CONFIRMED, DISDETTA_STATUS.SENT].includes(disdetta.status)) {
      return NextResponse.json({ error: 'Disdetta already processed' }, { status: 400 })
    }

    // Idempotency: reuse existing Payment Intent if still usable
    if (disdetta.stripe_payment_intent) {
      try {
        const existing = await stripe.paymentIntents.retrieve(disdetta.stripe_payment_intent)

        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
          return NextResponse.json({ clientSecret: existing.client_secret })
        }

        if (existing.status === 'succeeded') {
          return NextResponse.json({ error: 'Pagamento gi\u00e0 completato' }, { status: 400 })
        }
      } catch (err) {
        console.log('Previous payment intent invalid, creating new one')
      }
    }

    // Create new Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRICE_CENTS,
      currency: 'eur',
      metadata: {
        disdettaId: disdetta.id.toString(),
        userId: user.id,
      },
      receipt_email: user.email ?? undefined,
    })

    // Store payment intent ID for idempotency
    const { error: updateErr } = await supabase
      .from('disdette')
      .update({ stripe_payment_intent: paymentIntent.id })
      .eq('id', disdettaId)

    if (updateErr) {
      console.warn('Warning: failed to persist stripe_payment_intent', updateErr)
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: unknown) {
    console.error('Payment intent error:', error)
    return NextResponse.json(
      { error: 'Impossibile creare il pagamento. Riprova.' },
      { status: 500 }
    )
  }
}
