import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default async function AssistantPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Your intelligent transaction assistant</p>
      </div>

      <Card className="clay-element">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Assistant Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Your AI-powered assistant will help you manage transactions, schedule appointments, and provide insights.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
