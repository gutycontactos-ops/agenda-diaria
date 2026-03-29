import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({ user_id: userId, token, updated_at: new Date().toISOString() })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }
}
