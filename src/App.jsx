import React, { useEffect } from "react"
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "./lib/supabaseClient"   // 👈 import your Supabase client

function App() {
  useEffect(() => {
    async function testConnection() {
      // Try querying a table (replace "profiles" with any table you create in Supabase)
      const { data, error } = await supabase.from("profiles").select("*").limit(1)
      if (error) {
        console.error("❌ Supabase connection error:", error.message)
      } else {
        console.log("✅ Supabase connected! Sample data:", data)
      }
    }
    testConnection()
  }, [])

  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App