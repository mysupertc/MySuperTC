"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function FloatingEmailWidget({ autoOpenDraft, draftData, onClose }: any) {
  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="clay-element border-0 shadow-2xl">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">New Email</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">Email composer coming soon...</p>
        </div>
      </Card>
    </div>
  )
}
