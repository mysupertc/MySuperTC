import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Calendar, Plus } from "lucide-react"
import Link from "next/link"

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })

  // Group by status
  const active = transactions?.filter((t) => !["closed", "cancelled"].includes(t.status)) || []
  const closed = transactions?.filter((t) => t.status === "closed") || []
  const cancelled = transactions?.filter((t) => t.status === "cancelled") || []

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Link href={`/transactions/${transaction.id}`}>
      <Card className="clay-element hover:shadow-lg transition-all cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{transaction.property_address}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="capitalize">{transaction.agent_side}</span>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {transaction.status.replace("-", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {transaction.sales_price && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">${Number(transaction.sales_price).toLocaleString()}</span>
            </div>
          )}
          {transaction.close_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Close: {new Date(transaction.close_date).toLocaleDateString()}</span>
            </div>
          )}
          {(transaction.commission_listing || transaction.commission_buyer) && (
            <div className="text-sm">
              <span className="text-muted-foreground">Commission: </span>
              <span className="font-medium">
                ${Number((transaction.commission_listing || 0) + (transaction.commission_buyer || 0)).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage all your real estate transactions</p>
        </div>
        <Link href="/transactions/new">
          <Button className="clay-accent-mint">
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.length > 0 ? (
              active.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
            ) : (
              <div className="col-span-full">
                <Card className="clay-element">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active transactions</h3>
                    <p className="text-muted-foreground text-center mb-4">Start by creating your first transaction</p>
                    <Link href="/transactions/new">
                      <Button className="clay-accent-mint">
                        <Plus className="h-4 w-4 mr-2" />
                        New Transaction
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {closed.length > 0 ? (
              closed.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
            ) : (
              <div className="col-span-full">
                <Card className="clay-element">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No closed transactions</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cancelled.length > 0 ? (
              cancelled.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
            ) : (
              <div className="col-span-full">
                <Card className="clay-element">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No cancelled transactions</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
