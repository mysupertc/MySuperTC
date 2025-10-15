import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, MapPin } from "lucide-react"
import Link from "next/link"

export default async function PipelinePage() {
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Group transactions by status
  const prospecting = transactions?.filter((t) => t.status === "prospecting") || []
  const preListing = transactions?.filter((t) => t.status === "pre-listing") || []
  const listed = transactions?.filter((t) => t.status === "listed") || []
  const underContract = transactions?.filter((t) => t.status === "under-contract") || []
  const closed = transactions?.filter((t) => t.status === "closed") || []

  const stages = [
    { title: "Prospecting", transactions: prospecting, color: "clay-accent-blue" },
    { title: "Pre-Listing", transactions: preListing, color: "clay-accent-purple" },
    { title: "Listed", transactions: listed, color: "clay-accent-mint" },
    { title: "Under Contract", transactions: underContract, color: "clay-accent-orange" },
    { title: "Closed", transactions: closed, color: "bg-green-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Track your transactions through each stage</p>
      </div>

      {/* Pipeline Columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage.title} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{stage.title}</h3>
              <Badge variant="secondary">{stage.transactions.length}</Badge>
            </div>

            <div className="space-y-3">
              {stage.transactions.map((transaction) => (
                <Link key={transaction.id} href={`/transactions/${transaction.id}`}>
                  <Card className="clay-element hover:shadow-lg transition-all cursor-pointer">
                    <CardHeader className="p-4">
                      <div className={`h-1 w-full rounded-full ${stage.color} mb-3`} />
                      <CardTitle className="text-sm font-medium line-clamp-2">{transaction.address}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                      {transaction.price && (
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <DollarSign className="h-4 w-4" />
                          <span>${Number(transaction.price).toLocaleString()}</span>
                        </div>
                      )}
                      {transaction.close_date && (
                        <p className="text-xs text-muted-foreground">
                          Close: {new Date(transaction.close_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {stage.transactions.length === 0 && (
                <Card className="clay-element">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">No transactions</CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
