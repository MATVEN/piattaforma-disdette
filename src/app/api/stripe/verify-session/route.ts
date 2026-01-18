// src/app/api/stripe/verify-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/stripe-server'
import { createServerClient } from '@/lib/supabase/server'

/**
* Verify a Stripe Checkout session server-side with authentication.
* 
* Security:
* - ✅ Requires authenticated user
* - ✅ Verifies session belongs to user
* - ✅ Validates session ID format
* - ✅ Logs unauthorized access attempts
* 
* Request: { sessionId: string }
* Response: { ok: boolean, paid: boolean, session?: {...}, error?: string }
*/
export async function POST(req: NextRequest) {
 try {
   // 🔐 STEP 1: Authentication check
   const supabase = await createServerClient()
   const { data: { user }, error: authError } = await supabase.auth.getUser()

   if (authError || !user) {
     return NextResponse.json(
       { ok: false, error: 'Unauthorized' },
       { status: 401 }
     )
   }

   // STEP 2: Parse and validate request
   const body = await req.json().catch(() => ({}))
   const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''

   if (!sessionId) {
     return NextResponse.json(
       { ok: false, error: 'Missing sessionId' },
       { status: 400 }
     )
   }

   // STEP 3: Format validation (Stripe session IDs start with 'cs_')
   if (!sessionId.startsWith('cs_')) {
     return NextResponse.json(
       { ok: false, error: 'Invalid session ID format' },
       { status: 400 }
     )
   }

   // STEP 4: Retrieve session from Stripe
   const session = await stripe.checkout.sessions.retrieve(sessionId, {
     expand: ['payment_intent'],
   })

   if (!session || !session.id) {
     return NextResponse.json(
       { ok: false, error: 'Session not found' },
       { status: 404 }
     )
   }

   // 🔐 STEP 5: Verify ownership (CRITICAL SECURITY CHECK)
   if (session.metadata?.userId !== user.id) {
     console.warn(
       `[SECURITY] User ${user.id} attempted to verify session ${sessionId} owned by ${session.metadata?.userId}`
     )
     return NextResponse.json(
       { ok: false, error: 'Session does not belong to user' },
       { status: 403 }
     )
   }

   // STEP 6: Determine payment status (simplified logic)
   const paymentStatus = session.payment_status
   const paymentIntent = session.payment_intent as any | undefined

   // Primary: payment_status === 'paid'
   // Fallback: payment_intent.status === 'succeeded'
   const paid =
     paymentStatus === 'paid' ||
     (paymentIntent && paymentIntent.status === 'succeeded')

   // STEP 7: Return compact session summary
   const sessionSummary = {
     id: session.id,
     amount_total: session.amount_total ?? null,
     currency: session.currency ?? null,
     payment_status: paymentStatus ?? null,
     status: session.status ?? null,
     metadata: {
       disdettaId: session.metadata?.disdettaId ?? null,
     },
   }

   return NextResponse.json({
     ok: true,
     paid,
     session: sessionSummary,
   })

 } catch (err: any) {
   console.error('[verify-session] Error:', err)

   // Handle specific Stripe errors
   if (err.type === 'StripeInvalidRequestError') {
     return NextResponse.json(
       { ok: false, error: 'Invalid session ID' },
       { status: 400 }
     )
   }

   return NextResponse.json(
     { ok: false, error: 'Internal server error' },
     { status: 500 }
   )
 }
}