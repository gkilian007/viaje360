"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"

const LandingPage = dynamic(() => import("@/components/landing/LandingPage"), { ssr: false })

export default function RootPage() {
  const router = useRouter()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    async function check() {
      if (!isSupabaseBrowserConfigured()) {
        setShowLanding(true)
        return
      }

      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        router.replace("/home")
      } else {
        setShowLanding(true)
      }
    }

    void check()
  }, [router])

  if (!showLanding) return null

  return <LandingPage />
}
