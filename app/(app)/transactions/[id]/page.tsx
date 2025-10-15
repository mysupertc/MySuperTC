import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Calendar, User, Mail, Phone } from "lucide-react"
import { ChecklistSection } from "@/components/checklist-section"
import { TransactionTimeline } from "@/components/transaction-timeline"

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: transaction } = await supabase.from("transactions").select("*, clients(*)").eq("id", id).single()

  if (!transaction) {
    notFound()
  }

  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("transaction_id", id)
    .order("order_index", { ascending: true })

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("transaction_id", id)
    .order("due_date", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{transaction.address}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {transaction.status.replace("-", " ")}
            </Badge>
            <span className="text-muted-foreground capitalize">{transaction.type}</span>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="clay-element">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {transaction.price ? `$${Number(transaction.price).toLocaleString()}` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-element">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {transaction.commission ? `$${Number(transaction.commission).toLocaleString()}` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-element">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Close Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {transaction.close_date ? new Date(transaction.close_date).toLocaleDateString() : "TBD"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      {transaction.clients && (
        <Card className="clay-element">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full clay-accent-mint flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">{transaction.clients.name}</h3>
                {transaction.clients.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{transaction.clients.email}</span>
                  </div>
                )}
                {transaction.clients.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{transaction.clients.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Checklist and Timeline */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-6">
          <ChecklistSection transactionId={id} items={checklistItems || []} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TransactionTimeline tasks={tasks || []} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card className="clay-element">
            <CardHeader>
              <CardTitle>Transaction Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{transaction.notes || "No notes added yet"}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
