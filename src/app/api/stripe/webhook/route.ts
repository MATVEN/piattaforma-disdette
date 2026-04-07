// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/stripe-server';
import { createClient } from '@supabase/supabase-js'
import { sendEmail, getPaymentConfirmationEmail } from '@/lib/email/emailService'
import { DISDETTA_STATUS} from '@/types/enums'

// NOTE: depending on your Next.js configuration, you may want to ensure this route runs in "nodejs" runtime
// if you encounter issues with raw body or Stripe verification in edge runtime. Example:
// export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET in environment')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const disdettaId = session.metadata?.disdettaId
      const userId = session.metadata?.userId
      const paymentIntentId = session.payment_intent as string | undefined

      if (!disdettaId || !userId) {
        console.error('Missing metadata in webhook:', session.id)
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // SERVICE ROLE (bypassa RLS)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Try to get payment method type
      let paymentMethod = 'card'
      try {
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
          paymentMethod = paymentIntent.payment_method_types?.[0] || 'card'
        }
      } catch (err) {
        console.warn('Could not retrieve payment method:', err)
      }


      // Prima verifica se la disdetta esiste
      const { data: existingDisdetta, error: checkError } = await supabase
        .from('disdette')
        .select('id, user_id, status')
        .eq('id', parseInt(disdettaId, 10))
        .single()

      // Update disdetta
      const { data: updatedDisdetta, error: updateError } = await supabase
        .from('disdette')
        .update({
          status: DISDETTA_STATUS.CONFIRMED,
          payment_status: 'PAID',
          payment_amount: session.amount_total ?? 0,
          payment_currency: session.currency ?? 'eur',
          payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          stripe_session_id: session.id,
          stripe_payment_intent: paymentIntentId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parseInt(disdettaId, 10))
        .eq('user_id', userId)
        .select('*')
        .single()

        if (updateError || !updatedDisdetta) {
          console.error('Failed to update disdetta:', updateError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        // Add status history entry
        const { error: historyError } = await supabase
          .from('disdetta_status_history')
          .update({
            metadata: { note:`Pagamento confermato via Stripe (${paymentMethod})` }
          })
          .eq('disdetta_id', parseInt(disdettaId, 10))
          .eq('status', DISDETTA_STATUS.CONFIRMED)
          .order('timestamp', { ascending: false })
          .limit(1)

        if (historyError) {
          console.error('Failed to update history metadata:', historyError)
        }

      // Send confirmation email (best-effort)
      try {
        const userEmail = session.customer_email || session.customer_details?.email
        
        if (userEmail) {
          const emailTemplate = getPaymentConfirmationEmail({
            userName: 'Cliente',  // Usa nome generico
            disdettaId: parseInt(disdettaId, 10),
            supplierName: updatedDisdetta.supplier_name || 'operatore',
            amount: (session.amount_total ?? 0) / 100,
            paymentDate: new Date().toLocaleDateString('it-IT'),
          })

          await sendEmail({
            to: userEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          })

          console.log(`Confirmation email sent to ${userEmail}`)
        } else {
          console.warn('No customer email available for confirmation')
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Non bloccare webhook per errore email
      }

    }
  } catch (err) {
    console.error('Error handling webhook event:', err)
    // Return success to Stripe to avoid retries if you've handled logic partially?
    // But here we return 500 to signal failure; choose per your retry strategy.
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}