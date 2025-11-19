import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate the date 3 days ago
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Find users with 0 points who were created more than 3 days ago
    const { data: usersToDelete, error: fetchError } = await supabase
      .from('profiles')
      .select('id, created_at, points')
      .eq('points', 0)
      .lt('created_at', threeDaysAgo.toISOString())

    if (fetchError) {
      console.error('[v0] Error fetching users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found with 0 points for 3+ days',
        deletedCount: 0,
      })
    }

    console.log(
      `[v0] Found ${usersToDelete.length} users with 0 points for 3+ days`
    )

    let deletedCount = 0
    const errors: string[] = []

    // Delete each user (this will cascade delete related records)
    for (const userToDelete of usersToDelete) {
      try {
        // Delete from Supabase Auth
        const { error: authDeleteError } =
          await supabase.auth.admin.deleteUser(userToDelete.id)

        if (authDeleteError) {
          console.error(
            `[v0] Error deleting auth user ${userToDelete.id}:`,
            authDeleteError
          )
          errors.push(`User ${userToDelete.id}: ${authDeleteError.message}`)
          continue
        }

        // The profile and related records should be deleted via CASCADE
        deletedCount++
        console.log(`[v0] Successfully deleted user ${userToDelete.id}`)
      } catch (error) {
        console.error(
          `[v0] Error deleting user ${userToDelete.id}:`,
          error
        )
        errors.push(
          `User ${userToDelete.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} out of ${usersToDelete.length} users`,
      deletedCount,
      totalFound: usersToDelete.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[v0] Error in cleanup-zero-point-users:', error)
    return NextResponse.json(
      {
        error: 'Failed to cleanup users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
