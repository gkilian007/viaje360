"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Map, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/explore", icon: Compass, label: "Explorar" },
  { href: "/trip", icon: Map, label: "Mi Viaje" },
  { href: "/collection", icon: Trophy, label: "Colección" },
  { href: "/profile", icon: User, label: "Perfil" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                    : "bg-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-blue-400" : "text-slate-500"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
