"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewTransactionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to create a transaction")
      setIsLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        address: formData.get("address") as string,
        type: formData.get("type") as string,
        status: formData.get("status") as string,
        price: formData.get("price") ? Number(formData.get("price")) : null,
        commission: formData.get("commission") ? Number(formData.get("commission")) : null,
        close_date: formData.get("close_date") || null,
        notes: formData.get("notes") as string,
      })
      .select()
      .single()

    setIsLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      router.push(`/transactions/${data.id}`)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Transaction</h1>
          <p className="text-muted-foreground">Create a new real estate transaction</p>
        </div>
      </div>

      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input id="address" name="address" placeholder="123 Main St, City, State 12345" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Transaction Type *</Label>
                <Select name="type" defaultValue="listing" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listing">Listing</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue="prospecting" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="pre-listing">Pre-Listing</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="under-contract">Under Contract</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" placeholder="500000" step="0.01" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="commission">Commission</Label>
                  <Input id="commission" name="commission" type="number" placeholder="15000" step="0.01" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="close_date">Expected Close Date</Label>
                <Input id="close_date" name="close_date" type="date" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional information about this transaction..."
                  rows={4}
                />
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="clay-accent-mint flex-1" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Transaction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
