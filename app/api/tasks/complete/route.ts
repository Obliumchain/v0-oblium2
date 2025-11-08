import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isValidUUID, generateErrorId } from "@/lib/validation"

export async function POST(request: Request) {
  const errorId = generateErrorId()
  try {
    const supabase = await createClient()
    const { taskId } = await request.json()

    if (!taskId || !isValidUUID(taskId)) {
      return NextResponse.json({ error: "Invalid task ID", errorId }, { status: 400 })
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("active", true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found or inactive", errorId }, { status: 404 })
    }

    const { data: existingCompletion } = await supabase
      .from("task_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .maybeSingle()

    if (existingCompletion) {
      return NextResponse.json({ error: "Task already completed", errorId }, { status: 400 })
    }

    const { error: completionError } = await supabase.from("task_completions").insert({
      user_id: user.id,
      task_id: taskId,
      points_awarded: task.reward,
    })

    if (completionError) {
      console.error(`[${errorId}] Failed to complete task:`, completionError)
      return NextResponse.json({ error: "Failed to complete task", errorId }, { status: 500 })
    }

    const { error: pointsError } = await supabase.rpc("increment_points", {
      user_id: user.id,
      points_to_add: task.reward,
    })

    if (pointsError) {
      console.error(`[${errorId}] Failed to update points:`, pointsError)
      // Rollback completion if points update fails
      await supabase.from("task_completions").delete().eq("user_id", user.id).eq("task_id", taskId)
      return NextResponse.json({ error: "Failed to award points", errorId }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: task.reward,
    })
  } catch (error) {
    console.error(`[${errorId}] Task completion error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
