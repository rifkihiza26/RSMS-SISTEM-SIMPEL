import { createClient } from '@supabase/supabase-js'

const url = 'https://rfgxyiqxpensmfuebidl.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ3h5aXF4cGVuc21mdWViaWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjA5MjgsImV4cCI6MjEwNDAzNjkyOH0.sBGskQIlggRL0yLgsgx9ALJcwMoYEx5zg0QiCMp_CwQ'
const supabase = createClient(url, key)

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@bengkel.com',
    password: 'password123'
  })
  console.log("Auth error:", authError?.message)
  console.log("User:", authData?.user?.id)

  const { data, error } = await supabase.from('profiles').select('*').eq('id', authData?.user?.id).single()
  console.log("Profile data:", data)
  console.log("Profile error:", error)
}
check()
