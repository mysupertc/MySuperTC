import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Comment out redirect for now so you can access the dashboard
  // if (!user) {
  //   redirect("/auth/login")
  // }

  const userId = user?.id || "00000000-0000-0000-0000-000000000000"

  console.log("[v0] Dashboard - User:", user ? "Logged in" : "Not logged in (using test mode)")

  // Fetch dashboard data with error handling
  let transactions = []
  let tasks = []
  let upcomingEvents = []
  let completedTasksCount = 0
  let databaseError = false
  let needsUserIsolation = false

  try {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })

    if (transactionsError) throw transactionsError
    transactions = transactionsData || []

    if (transactions.length > 0) {
      needsUserIsolation = true
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from("task_items")
      .select("*")
      .eq("completed", false)
      .order("due_date", { ascending: true })
      .limit(5)

    if (tasksError) {
      console.log("[v0] Tasks query error (table may not exist):", tasksError.message)
      tasks = []
    } else {
      tasks = tasksData || []
    }

    upcomingEvents = []

    const { count, error: countError } = await supabase
      .from("task_items")
      .select("*", { count: "exact" })
      .eq("completed", true)

    if (countError) {
      console.log("[v0] Task count error:", countError.message)
      completedTasksCount = 0
    } else {
      completedTasksCount = count || 0
    }
  } catch (error) {
    console.log("[v0] Database error, using mock data:", error)
    databaseError = true

    // Mock data for development
    transactions = [
      {
        id: "1",
        property_address: "123 Main St, San Francisco, CA",
        agent_side: "listing",
        status: "pending",
        sales_price: 850000,
        commission_listing: 25500,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        property_address: "456 Oak Ave, Oakland, CA",
        agent_side: "buyer",
        status: "in_progress",
        sales_price: 650000,
        commission_buyer: 19500,
        created_at: new Date().toISOString(),
      },
    ]

    tasks = [
      {
        id: "1",
        task_name: "Schedule home inspection",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        section: "pre_listing",
        completed: false,
      },
      {
        id: "2",
        task_name: "Review purchase agreement",
        due_date: new Date(Date.now() + 172800000).toISOString(),
        section: "in_contract",
        completed: false,
      },
    ]

    upcomingEvents = [
      {
        id: "1",
        title: "Client Meeting - Property Viewing",
        start_time: new Date(Date.now() + 86400000).toISOString(),
        location: "123 Main St",
      },
      {
        id: "2",
        title: "Closing Appointment",
        start_time: new Date(Date.now() + 259200000).toISOString(),
        location: "Title Company Office",
      },
    ]

    completedTasksCount = 12
  }

  const activeTransactions = transactions?.filter((t) => t.status !== "closed" && t.status !== "cancelled") || []
  const totalVolume = transactions?.reduce((sum, t) => sum + (Number(t.sales_price) || 0), 0) || 0
  const totalCommission =
    transactions?.reduce((sum, t) => {
      const listing = Number(t.commission_listing) || 0
      const buyer = Number(t.commission_buyer) || 0
      return sum + listing + buyer
    }, 0) || 0

  return (
    <div className="space-y-6">
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-yellow-800">
            ⚠️ Demo Mode: You're viewing the dashboard without authentication. Sign in to see your actual data.
          </p>
        </div>
      )}

      {needsUserIsolation && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-orange-800 mb-2">🔒 Security Warning: User Isolation Not Configured</p>
          <p className="text-orange-700 mb-2">
            Your database is showing all transactions from all users. Run this migration to add user isolation:
          </p>
          <code className="block bg-orange-100 text-orange-900 p-2 rounded text-xs">
            scripts/005_add_profile_id_to_tables.sql
          </code>
          <p className="text-orange-700 mt-2 text-xs">
            This will add profile_id columns and Row Level Security policies to ensure users only see their own data.
          </p>
        </div>
      )}

      {databaseError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-800 mb-2">📊 Database Setup Required</p>
          <p className="text-blue-700 mb-2">
            The database tables need to be created. Run these SQL scripts in your Supabase SQL editor:
          </p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1 ml-2">
            <li>Your existing schema (creates transactions, clients, etc.)</li>
            <li>scripts/005_add_profile_id_to_tables.sql (adds user isolation)</li>
          </ol>
          <p className="text-blue-700 mt-2 text-xs">Currently showing sample data for development.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/transactions/new">
          <Button className="clay-accent-mint">📄 New Transaction</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-element">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTransactions.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="clay-element">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card className="clay-element">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card className="clay-element">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasksCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="clay-element">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTransactions.slice(0, 5).map((transaction) => (
                <Link key={transaction.id} href={`/transactions/${transaction.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.property_address}</p>
                      <p className="text-sm text-muted-foreground capitalize">{transaction.agent_side}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="capitalize">
                        {transaction.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">${Number(transaction.sales_price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {activeTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-5xl mb-2 opacity-50">📋</div>
                  <p>No active transactions</p>
                  <Link href="/transactions/new">
                    <Button variant="link" size="sm" className="mt-2">
                      Create your first transaction
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="clay-element">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Tasks</CardTitle>
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xl">⏰</span>
                    <div className="flex-1">
                      <p className="font-medium">{task.task_name}</p>
                      {task.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {task.section?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-5xl mb-2 opacity-50">✅</div>
                  <p>No upcoming tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Preview */}
      <Card className="clay-element">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                View Calendar →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg clay-accent-blue flex flex-col items-center justify-center text-white">
                      <span className="text-xs font-medium">
                        {new Date(event.start_time).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold">{new Date(event.start_time).getDate()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-5xl mb-2 opacity-50">📅</div>
                <p>No upcoming events</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
