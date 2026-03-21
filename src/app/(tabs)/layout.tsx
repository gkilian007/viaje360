import Header from "@/components/layout/Header"
import BottomNav from "@/components/layout/BottomNav"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-blue-950 flex flex-col">
      <div className="w-full max-w-[430px] mx-auto flex flex-col min-h-screen relative">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
