import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isValidUUID, generateErrorId } from "@/lib/validation"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  
  console.log(`[v0] [${errorId}] ====== EXTERNAL TASK WEBHOOK RECEIVED ======`)
  console.log(`[v0] [${errorId}] Timestamp: ${new Date().toISOString()}`)

  try {
    // Verify webhook signature for security
    const signature = request.headers.get("x-webhook-signature")
    const webhookSecret = process.env.WEBHOOK_SECRET

    console.log(`[v0] [${errorId}] Webhook secret configured: ${!!webhookSecret}`)
    console.log(`[v0] [${errorId}] Signature provided: ${!!signature}`)

    if (!webhookSecret) {
      console.error(`[v0] [${errorId}] WEBHOOK_SECRET not configured`)
      return NextResponse.json({ error: "Webhook not configured", errorId }, { status: 500 })
    }

    const body = await request.text()
    console.log(`[v0] [${errorId}] Request body:`, body)
    
    const payload = JSON.parse(body)
    console.log(`[v0] [${errorId}] Parsed payload:`, payload)

    // Verify signature to ensure request is from authorized external task app
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")
      console.log(`[v0] [${errorId}] Signature match: ${signature === expectedSignature}`)

      if (signature !== expectedSignature) {
        console.error(`[v0] [${errorId}] Invalid webhook signature`)
        return NextResponse.json({ error: "Invalid signature", errorId }, { status: 401 })
      }
    } else {
      console.warn(`[v0] [${errorId}] No signature provided - accepting request anyway for development`)
    }

    // Extract task completion details from webhook payload
    const { 
      userId, 
      taskIdentifier, 
      points, 
      taskData,
      timestamp 
    } = payload

    console.log(`[v0] [${errorId}] Task completion details:`, {
      userId,
      taskIdentifier,
      points,
      timestamp,
    })

    // Validate required fields
    if (!userId || !taskIdentifier || !points) {
      console.error(`[v0] [${errorId}] Missing required fields`)
      return NextResponse.json({ 
        error: "Missing required fields", 
        errorId,
        received: { userId: !!userId, taskIdentifier: !!taskIdentifier, points: !!points }
      }, { status: 400 })
    }

    // Validate UUID
    if (!isValidUUID(userId)) {
      console.error(`[v0] [${errorId}] Invalid UUID format`)
      return NextResponse.json({ error: "Invalid user ID format", errorId }, { status: 400 })
    }

    // Validate points
    if (typeof points !== "number" || points <= 0 || points > 100000) {
      console.error(`[v0] [${errorId}] Invalid points amount: ${points}`)
      return NextResponse.json({ error: "Invalid points amount", errorId }, { status: 400 })
    }

    // Validate task identifier
    if (typeof taskIdentifier !== "string" || taskIdentifier.length === 0 || taskIdentifier.length > 100) {
      console.error(`[v0] [${errorId}] Invalid task identifier: ${taskIdentifier}`)
      return NextResponse.json({ error: "Invalid task identifier", errorId }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[v0] [${errorId}] Supabase configuration missing`)
      return NextResponse.json({ error: "Server configuration error", errorId }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] Creating Supabase admin client...`)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify user exists
    console.log(`[v0] [${errorId}] Verifying user exists...`)
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, points")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error(`[v0] [${errorId}] User not found:`, userError)
      return NextResponse.json({ 
        error: "User not found", 
        details: userError,
        errorId 
      }, { status: 404 })
    }

    console.log(`[v0] [${errorId}] User found with ${user.points} points`)
    console.log(`[v0] [${errorId}] Processing task claim with California timezone check...`)

    // Process the task claim using the database function
    const { data: result, error: claimError } = await supabase.rpc(
      "process_external_task_claim",
      {
        p_user_id: userId,
        p_task_identifier: taskIdentifier,
        p_points: points,
        p_task_data: taskData || {}
      }
    )

    if (claimError) {
      console.error(`[v0] [${errorId}] Failed to process claim:`, claimError)
      return NextResponse.json({ 
        error: "Failed to process task claim", 
        details: claimError,
        errorId 
      }, { status: 500 })
    }

    const claimResult = result?.[0]

    if (!claimResult?.success) {
      console.log(`[v0] [${errorId}] Claim rejected: ${claimResult?.message}`)
      return NextResponse.json({
        success: false,
        message: claimResult?.message || "Task already claimed today",
        errorId
      }, { status: 200 })
    }

    console.log(`[v0] [${errorId}] ====== TASK CLAIM SUCCESSFUL ======`)
    console.log(`[v0] [${errorId}] User: ${userId}`)
    console.log(`[v0] [${errorId}] Task: ${taskIdentifier}`)
    console.log(`[v0] [${errorId}] Points awarded: ${claimResult.points_awarded}`)
    console.log(`[v0] [${errorId}] New total: ${claimResult.total_points}`)

    return NextResponse.json({
      success: true,
      message: claimResult.message,
      data: {
        claimId: claimResult.claim_id,
        pointsAwarded: claimResult.points_awarded,
        totalPoints: claimResult.total_points,
        userId,
        taskIdentifier,
      },
    })
  } catch (error) {
    console.error(`[v0] [${errorId}] ====== WEBHOOK ERROR ======`)
    console.error(`[v0] [${errorId}] Error:`, error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      errorId 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
