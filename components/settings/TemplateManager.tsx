"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"

interface Column {
  title: string
  key: string
  type: "text" | "number" | "checkbox" | "select" | "richtext"
  options?: string[]
}

interface TemplateManagerProps {
  title: string
  description: string
  ItemEntity: any
  columns: Column[]
  itemKey: string
  enableGrouping?: boolean
  groupKey?: string
  groupOptions?: Array<{ value: string; label: string }>
}

export default function TemplateManager({
  title,
  description,
  ItemEntity,
  columns,
  itemKey,
  enableGrouping = false,
  groupKey = "section",
  groupOptions = [],
}: TemplateManagerProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const data = await ItemEntity.list()
      setItems(data || [])
    } catch (error) {
      console.error(`Failed to fetch ${itemKey}s:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    const initialData: any = {}
    columns.forEach((col) => {
      if (col.type === "checkbox") {
        initialData[col.key] = false
      } else if (col.type === "number") {
        initialData[col.key] = 0
      } else {
        initialData[col.key] = ""
      }
    })
    if (enableGrouping && groupKey) {
      initialData[groupKey] = groupOptions[0]?.value || ""
    }
    setFormData(initialData)
    setEditingItem(null)
    setEditOpen(true)
  }

  const handleEdit = (item: any) => {
    setFormData({ ...item })
    setEditingItem(item)
    setEditOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingItem) {
        await ItemEntity.update(editingItem.id, formData)
      } else {
        await ItemEntity.create(formData)
      }
      await fetchItems()
      setEditOpen(false)
    } catch (error) {
      console.error(`Failed to save ${itemKey}:`, error)
      alert(`Failed to save ${itemKey}. Please try again.`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${itemKey}?`)) return
    try {
      await ItemEntity.delete(id)
      await fetchItems()
    } catch (error) {
      console.error(`Failed to delete ${itemKey}:`, error)
      alert(`Failed to delete ${itemKey}. Please try again.`)
    }
  }

  const groupedItems = enableGrouping
    ? groupOptions.reduce(
        (acc, group) => {
          acc[group.value] = items.filter((item) => item[groupKey] === group.value)
          return acc
        },
        {} as Record<string, any[]>,
      )
    : { all: items }

  return (
    <Card className="clay-element mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={handleAdd} className="clay-element clay-accent-mint border-0">
            <Plus className="w-4 h-4 mr-2" />
            Add {itemKey}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {enableGrouping
              ? groupOptions.map((group) => (
                  <div key={group.value}>
                    <h3 className="font-semibold text-lg mb-3">{group.label}</h3>
                    <div className="space-y-2">
                      {groupedItems[group.value]?.length > 0 ? (
                        groupedItems[group.value].map((item) => (
                          <div
                            key={item.id}
                            className="clay-element p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{columns[0] ? item[columns[0].key] : "Item"}</p>
                              {columns.slice(1, 3).map((col) => (
                                <p key={col.key} className="text-sm text-gray-600">
                                  {col.type === "checkbox"
                                    ? item[col.key]
                                      ? "✓ " + col.title
                                      : ""
                                    : item[col.key] || ""}
                                </p>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="clay-element"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="clay-element text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm py-4">No items in this section</p>
                      )}
                    </div>
                  </div>
                ))
              : items.map((item) => (
                  <div
                    key={item.id}
                    className="clay-element p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{columns[0] ? item[columns[0].key] : "Item"}</p>
                      {columns.slice(1, 3).map((col) => (
                        <p key={col.key} className="text-sm text-gray-600">
                          {col.type === "checkbox" ? (item[col.key] ? "✓ " + col.title : "") : item[col.key] || ""}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="clay-element">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="clay-element text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${itemKey}` : `Add ${itemKey}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {enableGrouping && groupKey && (
              <div>
                <Label>Section</Label>
                <Select
                  value={formData[groupKey] || ""}
                  onValueChange={(value) => setFormData({ ...formData, [groupKey]: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {columns.map((col) => (
              <div key={col.key}>
                <Label>{col.title}</Label>
                {col.type === "text" && (
                  <Input
                    value={formData[col.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="mt-1"
                  />
                )}
                {col.type === "number" && (
                  <Input
                    type="number"
                    value={formData[col.key] || 0}
                    onChange={(e) => setFormData({ ...formData, [col.key]: Number(e.target.value) })}
                    className="mt-1"
                  />
                )}
                {col.type === "checkbox" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      checked={formData[col.key] || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, [col.key]: checked })}
                    />
                    <span className="text-sm text-gray-600">Enable this option</span>
                  </div>
                )}
                {col.type === "select" && col.options && (
                  <Select
                    value={formData[col.key] || ""}
                    onValueChange={(value) => setFormData({ ...formData, [col.key]: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {col.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {col.type === "richtext" && (
                  <Textarea
                    value={formData[col.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    rows={6}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="clay-element clay-accent-mint border-0">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
