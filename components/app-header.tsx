"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/crm", label: "CRM", icon: "👥" },
    { href: "/contacts", label: "Contacts", icon: "📇" },
    { href: "/assistant", label: "Assistant", icon: "💬" },
    { href: "/calendar", label: "Calendar", icon: "📅" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-clay-border bg-clay-surface/95 backdrop-blur supports-[backdrop-filter]:bg-clay-surface/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg clay-accent-mint flex items-center justify-center font-bold text-sm">
              TC
            </div>
            <span className="font-semibold text-lg">MySuperTC</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <span>{item.icon}</span>
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={pathname.startsWith("/transactions") ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1"
                >
                  <span>📄</span>
                  Transactions
                  <span className="text-xs">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/transactions">Active Transactions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pipeline">Pipeline View</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/transactions/new">New Transaction</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <span>🚪</span>
          Sign Out
        </Button>
      </div>
    </header>
  )
}
