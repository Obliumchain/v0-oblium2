import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Wallet connect webhook received')

    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature')
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[v0] WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('[v0] Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[v0] Wallet connect webhook payload:', payload)

    const { userId, walletAddress, walletType } = payload

    if (!userId || !walletAddress) {
      console.error('[v0] Missing required fields:', { userId, walletAddress })
      return NextResponse.json({ error: 'Missing userId or walletAddress' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        wallet_address: walletAddress,
        wallet_connected_at: new Date().toISOString(),
        wallet_type: walletType || 'solana'
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('[v0] Error updating wallet:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    console.log('[v0] Wallet connected successfully:', data)

    return NextResponse.json({ 
      success: true, 
      message: 'Wallet connected successfully',
      walletAddress 
    })

  } catch (error) {
    console.error('[v0] Wallet connect webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
