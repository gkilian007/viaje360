"use client"

import { SideNav } from "./SideNav"

interface DesktopLayoutProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export function DesktopLayout({ leftPanel, rightPanel }: DesktopLayoutProps) {
  return (
    <div className="hidden lg:flex h-full w-full">
      <SideNav />
      {/* Left panel: 40% */}
      <div className="flex flex-col w-[40%] h-full overflow-y-auto border-r border-white/5">
        {leftPanel}
      </div>
      {/* Right panel: 60% */}
      <div className="flex-1 h-full relative">
        {rightPanel}
      </div>
    </div>
  )
}
