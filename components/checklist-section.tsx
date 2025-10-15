"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  category: string | null
}

export function ChecklistSection({ transactionId, items }: { transactionId: string; items: ChecklistItem[] }) {
  const [newItem, setNewItem] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()

  const handleToggle = async (itemId: string, completed: boolean) => {
    const supabase = createClient()
    await supabase.from("checklist_items").update({ completed: !completed }).eq("id", itemId)
    router.refresh()
  }

  const handleAdd = async () => {
    if (!newItem.trim()) return

    setIsAdding(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("checklist_items").insert({
        user_id: user.id,
        transaction_id: transactionId,
        title: newItem,
        completed: false,
      })
      setNewItem("")
      router.refresh()
    }
    setIsAdding(false)
  }

  return (
    <Card className="clay-element">
      <CardHeader>
        <CardTitle>Transaction Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox checked={item.completed} onCheckedChange={() => handleToggle(item.id, item.completed)} />
            <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.title}</span>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No checklist items yet. Add your first item below.</p>
        )}

        <div className="flex gap-2 pt-4">
          <Input
            placeholder="Add new checklist item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={isAdding || !newItem.trim()} className="clay-accent-mint">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
