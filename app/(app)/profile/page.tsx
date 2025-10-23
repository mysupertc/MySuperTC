"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { User } from "@/lib/api/entities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Upload } from "lucide-react"
import { UploadFile } from "@/lib/api/integrations"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me()
        setUser(currentUser)
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setUser((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const { file_url } = await UploadFile({ file })
      await User.updateMyUserData({ profile_picture_url: file_url })
      setUser((prev: any) => ({ ...prev, profile_picture_url: file_url }))
    } catch (error) {
      console.error("Image upload failed:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { id, email, role, ...updateData } = user
      await User.updateMyUserData(updateData)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <div className="text-center p-8">Could not load user profile.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-gray-500">Manage your personal and professional information.</p>
      </div>

      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url || "/placeholder.svg"}
                alt={user.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-gray-500">{user.full_name?.charAt(0)}</span>
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button as="span" variant="outline" className="clay-element bg-transparent" disabled={saving}>
              <Upload className="w-4 h-4 mr-2" />
              {saving ? "Uploading..." : "Upload Photo"}
            </Button>
          </label>
        </CardContent>
      </Card>

      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Full Name</Label>
            <Input
              value={user.full_name || ""}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input value={user.email || ""} disabled className="clay-element mt-1 bg-gray-100" />
          </div>
          <div>
            <Label>Cell Phone</Label>
            <Input
              value={user.cell_phone || ""}
              onChange={(e) => handleInputChange("cell_phone", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div>
            <Label>Office Phone</Label>
            <Input
              value={user.office_phone || ""}
              onChange={(e) => handleInputChange("office_phone", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>DRE #</Label>
            <Input
              value={user.dre_number || ""}
              onChange={(e) => handleInputChange("dre_number", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={user.website || ""}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input
              value={user.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div>
            <Label>Brokerage Name</Label>
            <Input
              value={user.brokerage_name || ""}
              onChange={(e) => handleInputChange("brokerage_name", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
          <div>
            <Label>Brokerage DRE #</Label>
            <Input
              value={user.brokerage_dre || ""}
              onChange={(e) => handleInputChange("brokerage_dre", e.target.value)}
              className="clay-element mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="clay-element clay-accent-mint border-0 px-8">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </div>
  )
}
