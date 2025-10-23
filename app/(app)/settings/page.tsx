"use client"

import { useState, useEffect } from "react"
import { User, DisclosureTemplate, TaskTemplate, EmailTemplate } from "@/lib/api/entities"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sun, Moon, Palette, List, CheckSquare, Mail, Loader2, Copy } from "lucide-react"
import TemplateManager from "@/components/settings/TemplateManager"
import EmailSignatureEditor from "@/components/email/EmailSignatureEditor"
import { Toggle } from "@/components/ui/toggle"
import { startGmailSync, stopGmailSync, getGoogleCallbackUrl, getGoogleAuthUrl } from "@/lib/api/functions"

export default function SettingsPage() {
  const [theme, setTheme] = useState("light")
  const [user, setUser] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [oauthInfo, setOauthInfo] = useState({ callbackUrl: "", jsOrigin: "" })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me()
        setUser(currentUser)
        setTheme(currentUser.theme || "light")
      } catch (e) {
        console.error(e)
      }
    }
    fetchUser()

    // Fetch OAuth helper URLs
    ;(async () => {
      try {
        const res = await getGoogleCallbackUrl()
        if (res.data?.callbackUrl) {
          setOauthInfo({
            callbackUrl: res.data.callbackUrl,
            jsOrigin: res.data.jsOrigin,
          })
        }
      } catch (e) {
        /* ignore */
      }
    })()
  }, [])

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)
    try {
      await User.updateMyUserData({ theme: newTheme })
    } catch (error) {
      console.error("Failed to save theme setting:", error)
    }
  }

  const handleConnectGmail = async () => {
    try {
      const response = await getGoogleAuthUrl()
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl
      } else {
        alert("Failed to generate Google authorization URL")
      }
    } catch (error) {
      console.error("Error connecting Gmail:", error)
      alert("Failed to connect Gmail. Please try again.")
    }
  }

  const handleDisconnectGmail = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Gmail? You will no longer be able to send/receive emails through your Gmail account.",
      )
    ) {
      return
    }

    try {
      await User.updateMyUserData({
        google_access_token: null,
        google_refresh_token: null,
        google_access_token_expiry: null,
        google_email: null,
        is_gmail_connected: false,
        is_gmail_sync_enabled: false,
      })
      setUser((prev: any) => ({ ...prev, is_gmail_connected: false, google_email: null, is_gmail_sync_enabled: false }))
    } catch (error) {
      console.error("Error disconnecting Gmail:", error)
      alert("Failed to disconnect Gmail. Please try again.")
    }
  }

  const handleSyncToggle = async () => {
    if (!user?.is_gmail_connected) {
      alert("Please connect your Gmail account first.")
      return
    }

    const previousSyncState = user.is_gmail_sync_enabled
    setSyncing(true)

    try {
      if (previousSyncState) {
        await stopGmailSync()
        setUser((prev: any) => ({ ...prev, is_gmail_sync_enabled: false }))
      } else {
        await startGmailSync()
        setUser((prev: any) => ({ ...prev, is_gmail_sync_enabled: true }))
      }
    } catch (error: any) {
      console.error("Error toggling Gmail sync:", error)
      const errorDetails = error.response?.data?.details || error.message || "An unknown error occurred."
      alert(`Failed to update sync status: ${errorDetails}`)
      setUser((prev: any) => ({ ...prev, is_gmail_sync_enabled: previousSyncState }))
    } finally {
      setSyncing(false)
    }
  }

  const disclosureColumns = [
    { title: "Document Name", key: "document_name", type: "text" as const },
    { title: "Notes", key: "notes", type: "text" as const },
    { title: "N/A S/B", key: "no_seller_buyer", type: "checkbox" as const },
  ]

  const taskColumns = [
    {
      title: "Section",
      key: "section",
      type: "select" as const,
      options: ["agent_broker", "escrow_title"],
    },
    { title: "Task Name", key: "task_name", type: "text" as const },
    { title: "Order", key: "order_index", type: "number" as const },
  ]

  const emailTemplateColumns = [
    { title: "Template Name", key: "name", type: "text" as const },
    { title: "Subject", key: "subject", type: "text" as const },
    { title: "Body", key: "body", type: "richtext" as const },
    {
      title: "Category",
      key: "category",
      type: "select" as const,
      options: ["General", "Transaction", "Marketing", "Follow-up", "Custom"],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Customize your application experience and workflows.</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 clay-element max-w-2xl">
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="disclosures">
            <List className="w-4 h-4 mr-2" />
            Disclosures
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card className="clay-element mt-4">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Select your preferred color scheme for the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={handleThemeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Dark
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="clay-element mt-4">
            <CardHeader>
              <CardTitle>Gmail Integration</CardTitle>
              <CardDescription>
                Connect your Gmail account to send and receive emails directly from the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.is_gmail_connected ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-green-800">Gmail Connected</p>
                      <p className="text-sm text-green-600">{user.google_email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnectGmail}
                    className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-800">Connect Gmail</p>
                    <p className="text-sm text-gray-600">Send and receive emails using your Gmail account</p>
                  </div>
                  <Button onClick={handleConnectGmail} className="bg-blue-600 hover:bg-blue-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Gmail
                  </Button>
                </div>
              )}
              {user?.is_gmail_connected && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-800">Enable Inbox Sync</p>
                    <p className="text-sm text-gray-600">Receive incoming emails in your transaction history.</p>
                  </div>
                  <Toggle
                    pressed={user?.is_gmail_sync_enabled}
                    onPressedChange={handleSyncToggle}
                    disabled={syncing}
                    aria-label="Toggle email sync"
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : user?.is_gmail_sync_enabled ? (
                      "On"
                    ) : (
                      "Off"
                    )}
                  </Toggle>
                </div>
              )}

              <div className="mt-6 p-4 rounded-lg border bg-gray-50">
                <p className="font-medium text-gray-800 mb-2">OAuth Setup Helper</p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Authorized redirect URI:</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={oauthInfo.callbackUrl || "Loading..."}
                        className="flex-1 text-xs clay-element px-2 py-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(oauthInfo.callbackUrl)
                        }}
                        className="h-8"
                        disabled={!oauthInfo.callbackUrl}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Authorized JavaScript origin:</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={oauthInfo.jsOrigin || "Loading..."}
                        className="flex-1 text-xs clay-element px-2 py-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(oauthInfo.jsOrigin)
                        }}
                        className="h-8"
                        disabled={!oauthInfo.jsOrigin}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Paste these values into Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client →
                  Edit.
                </p>
              </div>
            </CardContent>
          </Card>

          <EmailSignatureEditor />

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <TemplateManager
              title="Email Templates"
              description="Manage reusable email templates for quick and consistent communication."
              ItemEntity={EmailTemplate}
              columns={emailTemplateColumns}
              itemKey="email_template"
            />
          </div>
        </TabsContent>

        <TabsContent value="disclosures">
          <TemplateManager
            title="Disclosure Checklist Templates"
            description="Manage the default items that appear in the 'Disclosures Checklist' for new transactions."
            ItemEntity={DisclosureTemplate}
            columns={disclosureColumns}
            itemKey="disclosure"
            enableGrouping={true}
            groupKey="section"
            groupOptions={[
              { value: "purchase_agreement", label: "Purchase Agreement & Counters" },
              { value: "disclosures", label: "Disclosures" },
              { value: "broker_disclosures", label: "Broker Disclosures" },
              { value: "listing_agreement", label: "Listing Agreement" },
            ]}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TemplateManager
            title="Task Checklist Templates"
            description="Manage the default items that appear in the 'Task Checklist' for new transactions."
            ItemEntity={TaskTemplate}
            columns={taskColumns}
            itemKey="task"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
