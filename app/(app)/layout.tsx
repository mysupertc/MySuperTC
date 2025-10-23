import type React from "react"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { NotificationProvider } from "@/components/notifications/NotificationProvider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container px-4 py-6">{children}</main>
        <AppFooter />
      </div>
    </NotificationProvider>
  )
}
