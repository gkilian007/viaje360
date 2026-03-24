"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"

export function RootRedirect() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function check() {
      if (!isSupabaseBrowserConfigured()) {
        // No Supabase → go to login
        router.replace("/login")
        return
      }

      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        router.replace("/home")
      } else {
        router.replace("/login")
      }
      setChecked(true)
    }

    void check()
  }, [router])

  if (!checked) return null
  return null
}
