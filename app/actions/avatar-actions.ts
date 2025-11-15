'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function selectAvatar(avatarUrl: string) {
  console.log('[v0] Avatar selection server action called with:', avatarUrl)
  
  try {
    const supabase = await createClient()
    
    console.log('[v0] Supabase client created')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('[v0] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    })
    
    if (sessionError) {
      console.error('[v0] Session error:', sessionError)
      return { 
        success: false, 
        error: 'Session error: ' + sessionError.message 
      }
    }
    
    if (!session?.user) {
      console.error('[v0] No session or user found')
      return { 
        success: false, 
        error: 'Not authenticated - no session' 
      }
    }

    const userId = session.user.id
    console.log('[v0] Updating avatar for user:', userId)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Profile update error:', updateError)
      return { 
        success: false, 
        error: 'Failed to update profile: ' + updateError.message 
      }
    }

    console.log('[v0] Avatar updated successfully')

    // Revalidate pages that show avatar
    revalidatePath('/profile')
    revalidatePath('/leaderboard')
    revalidatePath('/dashboard')

    return { 
      success: true, 
      avatarUrl 
    }
  } catch (error) {
    console.error('[v0] Avatar selection error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select avatar' 
    }
  }
}
