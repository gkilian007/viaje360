"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_TABS } from "@/lib/constants"
import { useAppStore } from "@/store/useAppStore"

export function SideNav() {
  const pathname = usePathname()
  const { user } = useAppStore()

  return (
    <div
      className="hidden lg:flex flex-col items-center py-6 w-[72px] shrink-0 h-full"
      style={{
        background: "rgba(19, 19, 21, 0.95)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-[#0A84FF] flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-white text-[20px] filled"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
          flight_takeoff
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-2 flex-1">
        {NAV_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.id}
              href={tab.href}
              title={tab.label}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-200 group ${
                isActive ? "bg-[#0A84FF]/20 nav-active-glow" : "hover:bg-white/5"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-all ${
                  isActive ? "text-[#0A84FF]" : "text-[#c0c6d6] group-hover:text-white"
                }`}
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                    : {}
                }
              >
                {tab.icon}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Avatar at bottom */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
      >
        {user.name.charAt(0)}
      </div>
    </div>
  )
}
