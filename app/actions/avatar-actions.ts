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

    // Revalidate pages that show avatar
    revalidatePath('/profile')
    revalidatePath('/leaderboard')
    revalidatePath('/dashboard')

    return { 
      success: true, 
      avatarUrl 
    }
  } catch (error) {
    console.error('[v0] Server: Avatar selection error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select avatar' 
    }
  }
}
