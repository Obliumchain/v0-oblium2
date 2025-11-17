import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  
  try {
    console.log(`[v0] [${errorId}] Wallet connect webhook received`)

    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature')
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error(`[v0] [${errorId}] WEBHOOK_SECRET not configured`)
      return NextResponse.json({ error: 'Server configuration error', errorId }, { status: 500 })
    }

    const body = await request.text()
    console.log(`[v0] [${errorId}] Raw webhook body:`, body)
    
    const payload = JSON.parse(body)

    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error(`[v0] [${errorId}] Invalid webhook signature`, {
          received: signature,
          expected: expectedSignature
        })
        return NextResponse.json({ error: 'Invalid signature', errorId }, { status: 401 })
      }
      console.log(`[v0] [${errorId}] Signature verified successfully`)
    } else {
      console.warn(`[v0] [${errorId}] No signature provided, skipping verification (DEV MODE)`)
    }

    console.log(`[v0] [${errorId}] Wallet connect webhook payload:`, payload)

    const userId = payload.userId || payload.user_id
    const walletAddress = payload.walletAddress || payload.wallet_address || payload.address
    const walletType = payload.walletType || payload.wallet_type || 'solana'

    if (!userId || !walletAddress) {
      console.error(`[v0] [${errorId}] Missing required fields:`, { 
        userId, 
        walletAddress,
        receivedFields: Object.keys(payload)
      })
      return NextResponse.json({ 
        error: 'Missing required fields', 
        errorId,
        required: ['userId or user_id', 'walletAddress or wallet_address or address'],
        received: Object.keys(payload)
      }, { status: 400 })
    }

    console.log(`[v0] [${errorId}] Attempting to update wallet for user:`, userId)

    const supabase = await createClient()

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, nickname, wallet_address')
      .eq('id', userId)
      .single()

    if (fetchError || !existingProfile) {
      console.error(`[v0] [${errorId}] User not found:`, { userId, error: fetchError })
      return NextResponse.json({ 
        error: 'User not found', 
        errorId,
        details: fetchError?.message 
      }, { status: 404 })
    }

    console.log(`[v0] [${errorId}] Found user profile:`, existingProfile)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        wallet_address: walletAddress,
        wallet_connected_at: new Date().toISOString(),
        wallet_type: walletType
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error(`[v0] [${errorId}] Error updating wallet:`, {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: 'Database error', 
        errorId,
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error(`[v0] [${errorId}] No data returned after update`)
      return NextResponse.json({ 
        error: 'Update failed - no data returned', 
        errorId 
      }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] Wallet connected successfully:`, {
      userId: data[0].id,
      walletAddress: data[0].wallet_address,
      walletType: data[0].wallet_type
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Wallet connected successfully',
      walletAddress,
      userId 
    })

  } catch (error) {
    console.error(`[v0] [${errorId}] Wallet connect webhook error:`, {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        errorId,
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
