'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function selectAvatar(avatarUrl: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Not authenticated' 
      }
    }

    console.log('[v0] Server: Selecting avatar for user:', user.id)
    
    // Check if user already has an avatar
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    const isFirstAvatar = !currentProfile?.avatar_url

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Server: Profile update error:', updateError)
      return { 
        success: false, 
        error: 'Failed to update profile' 
      }
    }

    console.log('[v0] Server: Profile updated with avatar')

    // If this is the first avatar, award points
    let pointsAwarded = 0
    if (isFirstAvatar) {
      console.log('[v0] Server: First avatar - checking for task...')

      const { data: avatarTask } = await supabase
        .from('tasks')
        .select('id, reward')
        .eq('title', 'Set Your Profile Avatar')
        .eq('active', true)
        .single()

      if (avatarTask) {
        console.log('[v0] Server: Avatar task found:', avatarTask.id)

        // Check if task already completed
        const { data: existingCompletion } = await supabase
          .from('task_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('task_id', avatarTask.id)
          .maybeSingle()

        if (!existingCompletion) {
          console.log('[v0] Server: Recording task completion...')

          // Insert task completion
          const { error: taskError } = await supabase
            .from('task_completions')
            .insert({
              user_id: user.id,
              task_id: avatarTask.id,
              points_awarded: avatarTask.reward,
            })

          if (taskError) {
            console.error('[v0] Server: Task completion error:', taskError)
          } else {
            // Update user points
            const { data: profile } = await supabase
              .from('profiles')
              .select('points')
              .eq('id', user.id)
              .single()

            if (profile) {
              const newPoints = (profile.points || 0) + avatarTask.reward
              const { error: pointsError } = await supabase
                .from('profiles')
                .update({ points: newPoints })
                .eq('id', user.id)

              if (!pointsError) {
                pointsAwarded = avatarTask.reward
                console.log('[v0] Server: Points awarded:', pointsAwarded)
              }
            }
          }
        } else {
          console.log('[v0] Server: Task already completed')
        }
      }
    }

    // Revalidate pages that show avatar
    revalidatePath('/profile')
    revalidatePath('/leaderboard')
    revalidatePath('/dashboard')

    return { 
      success: true, 
      avatarUrl, 
      pointsAwarded 
    }
  } catch (error) {
    console.error('[v0] Server: Avatar selection error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select avatar' 
    }
  }
}
