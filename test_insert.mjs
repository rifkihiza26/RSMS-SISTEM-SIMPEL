import { createClient } from '@supabase/supabase-js'

const url = 'https://rfgxyiqxpensmfuebidl.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ3h5aXF4cGVuc21mdWViaWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjA5MjgsImV4cCI6MjEwNDAzNjkyOH0.sBGskQIlggRL0yLgsgx9ALJcwMoYEx5zg0QiCMp_CwQ'
const supabase = createClient(url, key)

async function test() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@rsms.com',
    password: 'password123' // assuming this is what they used
  })
  
  console.log("Auth:", authErr ? authErr.message : "Success")
  
  if (auth?.user) {
    const { data, error } = await supabase.from('products').select('*').limit(1)
    console.log("Select Products Error:", error ? error.message : "Success")

    const { error: insErr } = await supabase.from('products').insert({
      sku: 'TEST-001',
      name: 'Test Product',
      selling_price: 10000,
      stock: 10,
      minimum_stock: 2,
      status: 'ACTIVE'
    })
    console.log("Insert Product Error:", insErr ? insErr.message : "Success")
  }
}
test()
