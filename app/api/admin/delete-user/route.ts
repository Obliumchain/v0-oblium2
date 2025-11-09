import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "obliumchain@obliumtoken.com"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.email !== ADMIN_EMAIL) {
      console.log("[v0] Unauthorized admin API access attempt:", user.email)
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    console.log("[v0] Admin deleting user:", userId)

    // Delete user's data in order (respecting foreign key constraints)
    // 1. Delete referrals where user was referred by someone
    await supabase.from("referrals").delete().eq("referred_user_id", userId)

    // 2. Delete referrals where user referred others
    await supabase.from("referrals").delete().eq("referrer_id", userId)

    // 3. Delete task completions
    await supabase.from("task_completions").delete().eq("user_id", userId)

    // 4. Delete user boosters
    await supabase.from("user_boosters").delete().eq("user_id", userId)

    // 5. Delete booster transactions
    await supabase.from("booster_transactions").delete().eq("user_id", userId)

    // 6. Delete conversion history
    await supabase.from("conversion_history").delete().eq("user_id", userId)

    // 7. Delete profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (profileError) throw profileError

    // 8. Delete auth user using admin API
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("[v0] Error deleting auth user:", deleteAuthError)
      // Continue even if auth deletion fails - profile is already deleted
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}
