"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Plus, Building, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewTransactionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"search" | "off-market" | "confirm">("search")
  const [mlsNumber, setMlsNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [property, setProperty] = useState<any | null>(null)

  // 🔍 Search MLS by API
  const handleSearchMLS = async () => {
    if (!mlsNumber.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/mls?mlsNumber=${encodeURIComponent(mlsNumber.trim())}`)
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "No property found")
      setProperty(result.data)
      setMode("confirm")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 🏡 Manual entry
  const handleOffMarket = () => {
    setProperty({
      StreetAddress: "",
      City: "",
      StateAbbrv: "CA",
      Zip: "",
      ListPrice: "",
      PropertySubType: "single_family",
    })
    setMode("confirm")
  }

  // 💾 Save to Supabase via API
  const handleCreateTransaction = async () => {
    if (!property) return
    setLoading(true)
    setError("")

    try {
      const payload = {
        property_address: `${property.StreetAddress}, ${property.City}, ${property.StateAbbrv} ${property.Zip}`,
        mls_number: property.ListingKey || "",
        property_type: property.PropertySubType || "single_family",
        sales_price: property.ListPrice || null,
        status: "prospecting",
        agent_side: "seller_side",
      }

      const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to create transaction")

      // ✅ redirect immediately after success
      router.push(`/transactions/${result.transaction.id}`)
    } catch (err: any) {
      console.error("Create transaction error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---------------- UI STATES ----------------
  if (mode === "search") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/transactions">
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">New Transaction</h1>
            <p className="text-muted-foreground">Choose how to add your property</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3"><Search />MLS Property Search</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>MLS Number</Label>
              <Input
                placeholder="Enter MLS number"
                value={mlsNumber}
                onChange={(e) => setMlsNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchMLS()}
              />
              <Button onClick={handleSearchMLS} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                {loading ? "Searching..." : "Search Property"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3"><Building />Off-Market Property</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">Add property manually for off-market listings.</p>
              <Button onClick={handleOffMarket} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Off-Market Property</Button>
            </CardContent>
          </Card>
        </div>

        {error && <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      </div>
    )
  }

  if (mode === "confirm" && property) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Confirm Property Details</h1>
        <Card>
          <CardContent className="space-y-4 py-6">
            <Label>Street Address</Label>
            <Input
              value={property.StreetAddress}
              onChange={(e) => setProperty({ ...property, StreetAddress: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={property.City}
                  onChange={(e) => setProperty({ ...property, City: e.target.value })}
                />
              </div>
              <div>
                <Label>Zip</Label>
                <Input
                  value={property.Zip}
                  onChange={(e) => setProperty({ ...property, Zip: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setMode("search")}>Back</Button>
          <Button onClick={handleCreateTransaction} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {loading ? "Creating..." : "Create Transaction"}
          </Button>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      </div>
    )
  }

  return null
}
