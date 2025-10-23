"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { User } from "@/lib/api/entities"
import { Loader2, Save } from "lucide-react"

export default function EmailSignatureEditor() {
  const [signature, setSignature] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const user = await User.me()
        setSignature(user.email_signature || "")
      } catch (error) {
        console.error("Failed to fetch email signature:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSignature()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await User.updateMyUserData({ email_signature: signature })
    } catch (error) {
      console.error("Failed to save email signature:", error)
      alert("Failed to save email signature. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="clay-element mt-4">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="clay-element mt-4">
      <CardHeader>
        <CardTitle>Email Signature</CardTitle>
        <CardDescription>Customize your email signature that appears at the end of your emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          rows={8}
          placeholder="Enter your email signature here..."
          className="clay-element"
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="clay-element clay-accent-mint border-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
