"use client"

import { useMemo } from "react"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, X, ExternalLink, Percent, DollarSign, Edit2 } from "lucide-react"
import { geocodeAddress } from "@/lib/api/functions"
import { Download, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { format, parseISO, differenceInDays, isPast } from "date-fns"

const DATE_DEFINITIONS = [
  { key: "original_contract_date", label: "Original Contract Date", base: null, isBusinessDays: false },
  { key: "offer_acceptance_date", label: "Offer Acceptance", base: null, isBusinessDays: false },
  { key: "emd_due_date", label: "Earnest Money Deposit", base: "offer_acceptance_date", isBusinessDays: true },
  { key: "seller_disclosures_date", label: "Seller Disclosures Delivery", base: "offer_acceptance_date" },
  { key: "investigation_contingency_date", label: "Investigation Contingency", base: "offer_acceptance_date" },
  { key: "appraisal_contingency_date", label: "Appraisal Contingency", base: "offer_acceptance_date" },
  { key: "loan_contingency_date", label: "Loan Contingency", base: "offer_acceptance_date" },
  { key: "disclosures_due_back_date", label: "Disclosures Due Back", base: "seller_disclosures_date" },
  { key: "final_walkthrough_date", label: "Final Walkthrough", base: "close_of_escrow_date" },
  { key: "close_of_escrow_date", label: "Close of Escrow", base: "offer_acceptance_date" },
  { key: "possession_date", label: "Date of Possession", base: "close_of_escrow_date" },
]

const STATUS_GROUPS = [
  { title: "Overdue", key: "overdue" },
  { title: "In Progress", key: "in_progress" },
  { title: "Negotiating", key: "negotiating" },
  { title: "Extended", key: "extended" },
  { title: "Completed", key: "completed" },
  { title: "Waived", key: "waived" },
]

const statusOptions = ["in_progress", "completed", "overdue", "waived", "negotiating", "extended"]

const getStatusInfo = (status, date) => {
  if (status === "completed" || status === "waived") return { color: "bg-green-100 text-green-700", icon: CheckCircle }
  if (status === "overdue" || (date && isPast(date) && status !== "completed" && status !== "waived"))
    return { color: "bg-red-100 text-red-700", icon: AlertCircle }
  return { color: "bg-blue-100 text-blue-700", icon: Clock }
}

const formatCurrency = (value: any) => {
  if (value === "" || value === null || value === undefined) return ""
  const numericValue = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""))
  if (isNaN(numericValue)) return ""
  return `$${numericValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

const parseCurrency = (value: any) => {
  if (value === "" || value === null || value === undefined) return ""
  return String(value).replace(/[^\d.-]/g, "")
}

const CurrencyInput = ({ value, onChange, ...props }: any) => {
  const [inputValue, setInputValue] = useState(() => formatCurrency(value))
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const numericProp = parseCurrency(value)
    const numericState = parseCurrency(inputValue)
    if (numericProp !== numericState) {
      setInputValue(formatCurrency(value))
    }
  }, [value, inputValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      const numericValue = parseCurrency(rawValue)
      onChange(numericValue)
    }, 400)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    const numericValue = parseCurrency(e.target.value)
    setInputValue(formatCurrency(numericValue))
    onChange(numericValue)
  }

  return <Input {...props} value={inputValue} onChange={handleChange} onBlur={handleBlur} />
}

const DebouncedInput = ({ value, onChange, type = "text", ...props }: any) => {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value)
    }
  }, [value, localValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      onChange(newValue)
    }, 400)
  }

  const handleBlur = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
      debounceTimeout.current = null
    }
    onChange(localValue)
  }

  return <Input {...props} type={type} value={localValue || ""} onChange={handleChange} onBlur={handleBlur} />
}

export default function TransactionInfo({ transaction, onUpdate, scrollToSalesPrice = false }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [emdInputType, setEmdInputType] = useState("percentage")
  const [listingCommInputType, setListingCommInputType] = useState("flat")
  const [buyerCommInputType, setBuyerCommInputType] = useState("flat")
  const [geocoding, setGeocoding] = useState(false)
  const [openSheetKey, setOpenSheetKey] = useState(null)

  useEffect(() => {
    if (transaction && transaction.property_address && (!transaction.latitude || !transaction.longitude)) {
      const autoGeocodeOnLoad = async () => {
        try {
          const response = await geocodeAddress({ address: transaction.property_address })
          if (response.data.success) {
            const updatePayload = {
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            }
            onUpdate(updatePayload)
          }
        } catch (error) {
          console.error("Automatic background geocoding failed:", error)
        }
      }
      autoGeocodeOnLoad()
    }
  }, [transaction, onUpdate])

  useEffect(() => {
    const convertedData: any = {}
    Object.keys(transaction).forEach((key) => {
      if (transaction[key] === null || transaction[key] === undefined) {
        convertedData[key] = ""
      } else {
        convertedData[key] = String(transaction[key])
      }
    })
    setEditData(convertedData)

    if (transaction.emd_percentage !== null && transaction.emd_percentage !== undefined) {
      setEmdInputType("percentage")
    } else if (transaction.emd_amount !== null && transaction.emd_amount !== undefined) {
      setEmdInputType("flat")
    }

    if (transaction.commission_listing_percentage !== null && transaction.commission_listing_percentage !== undefined) {
      setListingCommInputType("percentage")
    } else if (transaction.commission_listing !== null && transaction.commission_listing !== undefined) {
      setListingCommInputType("flat")
    }

    if (transaction.commission_buyer_percentage !== null && transaction.commission_buyer_percentage !== undefined) {
      setBuyerCommInputType("percentage")
    } else if (transaction.commission_buyer !== null && transaction.commission_buyer !== undefined) {
      setBuyerCommInputType("flat")
    }
  }, [transaction])

  useEffect(() => {
    if (scrollToSalesPrice && !isEditing) {
      setIsEditing(true)
      setTimeout(() => {
        const salesPriceInput = document.querySelector('input[data-field="sales_price"]') as HTMLInputElement
        if (salesPriceInput) {
          salesPriceInput.focus()
          salesPriceInput.select()
        }
      }, 100)
    }
  }, [scrollToSalesPrice, isEditing])

  useEffect(() => {
    if (!isEditing) return

    const salesPrice = Number.parseFloat(editData.sales_price) || 0

    if (emdInputType === "percentage" && editData.emd_percentage && salesPrice > 0) {
      const emdPercentage = Number.parseFloat(editData.emd_percentage) || 0
      const calculatedEMD = (salesPrice * emdPercentage) / 100
      setEditData((prev: any) => ({ ...prev, emd_amount: calculatedEMD.toString() }))
    } else if (emdInputType === "flat" && editData.emd_amount === "") {
      setEditData((prev: any) => ({ ...prev, emd_percentage: "" }))
    }

    if (listingCommInputType === "percentage" && editData.commission_listing_percentage && salesPrice > 0) {
      const commPercentage = Number.parseFloat(editData.commission_listing_percentage) || 0
      const calculatedComm = (salesPrice * commPercentage) / 100
      setEditData((prev: any) => ({ ...prev, commission_listing: calculatedComm.toString() }))
    } else if (listingCommInputType === "flat" && editData.commission_listing === "") {
      setEditData((prev: any) => ({ ...prev, commission_listing_percentage: "" }))
    }

    if (buyerCommInputType === "percentage" && editData.commission_buyer_percentage && salesPrice > 0) {
      const commPercentage = Number.parseFloat(editData.commission_buyer_percentage) || 0
      const calculatedComm = (salesPrice * commPercentage) / 100
      setEditData((prev: any) => ({ ...prev, commission_buyer: calculatedComm.toString() }))
    } else if (buyerCommInputType === "flat" && editData.commission_buyer === "") {
      setEditData((prev: any) => ({ ...prev, commission_buyer_percentage: "" }))
    }
  }, [
    editData.sales_price,
    editData.emd_percentage,
    editData.emd_amount,
    editData.commission_listing_percentage,
    editData.commission_listing,
    editData.commission_buyer_percentage,
    editData.commission_buyer,
    isEditing,
    emdInputType,
    listingCommInputType,
    buyerCommInputType,
  ])

  const handleInputChange = useCallback(async (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }))

    if (field === "property_address") {
      if (value && value.length > 10) {
        setGeocoding(true)
        try {
          const response = await geocodeAddress({ address: value })
          if (response.data.success) {
            setEditData((prev: any) => ({
              ...prev,
              latitude: response.data.latitude.toString(),
              longitude: response.data.longitude.toString(),
            }))
          } else {
            setEditData((prev: any) => ({
              ...prev,
              latitude: "",
              longitude: "",
            }))
          }
        } catch (error) {
          console.error("Geocoding failed:", error)
          setEditData((prev: any) => ({
            ...prev,
            latitude: "",
            longitude: "",
          }))
        } finally {
          setGeocoding(false)
        }
      } else if (!value) {
        setEditData((prev: any) => ({
          ...prev,
          latitude: "",
          longitude: "",
        }))
        setGeocoding(false)
      }
    }
  }, [])

  const prepareDataForSave = useCallback((data: any) => {
    const cleanedData: any = {}
    Object.keys(data).forEach((key) => {
      const value = data[key]

      const numericFields = [
        "sales_price",
        "emd_amount",
        "emd_percentage",
        "commission_listing",
        "commission_buyer",
        "commission_listing_percentage",
        "commission_buyer_percentage",
        "home_warranty_amount",
        "property_sf",
        "property_lot_sf",
        "year_built",
        "latitude",
        "longitude",
      ]

      if (numericFields.includes(key)) {
        if (value === "" || value === null || value === undefined) {
          cleanedData[key] = null
        } else {
          const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""))
          cleanedData[key] = isNaN(parsed) ? null : parsed
        }
      } else {
        cleanedData[key] = value === "" ? null : value
      }
    })
    return cleanedData
  }, [])

  const handleSave = useCallback(() => {
    const cleanedData = prepareDataForSave(editData)
    onUpdate(cleanedData)
    setIsEditing(false)
  }, [editData, onUpdate, prepareDataForSave])

  const handleCancel = useCallback(() => {
    const convertedData: any = {}
    Object.keys(transaction).forEach((key) => {
      if (transaction[key] === null || transaction[key] === undefined) {
        convertedData[key] = ""
      } else {
        convertedData[key] = String(transaction[key])
      }
    })
    setEditData(convertedData)
    setIsEditing(false)
  }, [transaction])

  const InfoItem = ({ label, value, children }: any) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {children ? children : <p className="font-semibold mt-1 text-gray-800">{value || "N/A"}</p>}
    </div>
  )

  const EditItem = ({ label, children }: any) => (
    <div>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )

  const groupedDates = useMemo(() => {
    const dates = DATE_DEFINITIONS.map((def) => {
      const date = transaction[def.key] ? parseISO(transaction[def.key]) : null
      let status = transaction[`${def.key}_status`] || "in_progress"
      const notes = transaction[`${def.key}_notes`] || ""
      const daysRemaining = date ? differenceInDays(date, new Date()) : null

      // Force original contract date to always be completed
      if (def.key === "original_contract_date") {
        status = "completed"
      } else if (def.key === "offer_acceptance_date" && date) {
        status = "completed"
      } else if (date && isPast(date) && status !== "completed" && status !== "waived") {
        status = "overdue"
      }

      return { ...def, date, status, notes, daysRemaining }
    })

    const groups = {}
    STATUS_GROUPS.forEach((g) => {
      groups[g.key] = []
    })

    dates.forEach((dateItem) => {
      if (groups[dateItem.status]) {
        groups[dateItem.status].push(dateItem)
      }
    })

    Object.values(groups).forEach((group) => {
      group.sort((a, b) => (a.date || new Date("2999-12-31")) - (b.date || new Date("2999-12-31")))
    })

    return groups
  }, [transaction])

  const handleUpdate = async (key, data) => {
    const updatePayload = {
      [key]: data.date,
      [`${key}_status`]: data.status,
      [`${key}_notes`]: data.notes,
    }
    await onUpdate(updatePayload)
    setOpenSheetKey(null)
  }

  const generateICS = (dateItem) => {
    const dateStr = format(dateItem.date, "yyyyMMdd")
    const propertyAddressShort = transaction.property_address?.split(",")[0]?.trim() || "Property"
    const title = `${dateItem.label} - ${propertyAddressShort}`

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Transaction Calendar//EN\n"
    icsContent += `BEGIN:VEVENT\n`
    icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`
    icsContent += `SUMMARY:${title}\n`
    icsContent += `DESCRIPTION:${dateItem.notes || dateItem.label}\n` // Changed description to fallback to label
    icsContent += `BEGIN:VALARM\n`
    icsContent += `TRIGGER:-P1D\n`
    icsContent += `ACTION:DISPLAY\n`
    icsContent += `DESCRIPTION:Reminder: ${title}\n`
    icsContent += `END:VALARM\n`
    icsContent += `END:VEVENT\n`
    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${title}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateTransactionCalendar = () => {
    const propertyAddressShort = transaction.property_address?.split(",")[0]?.trim() || "Property"
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Transaction Calendar//EN\n"

    // Add all important dates for this transaction
    DATE_DEFINITIONS.forEach((def) => {
      const date = transaction[def.key]
      if (date) {
        const dateStr = format(parseISO(date), "yyyyMMdd")
        const title = `${def.label} - ${propertyAddressShort}`
        const notes = transaction[`${def.key}_notes`] || ""

        icsContent += `BEGIN:VEVENT\n`
        icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`
        icsContent += `SUMMARY:${title}\n`
        icsContent += `DESCRIPTION:${notes || def.label}\n`
        icsContent += `BEGIN:VALARM\n`
        icsContent += `TRIGGER:-P1D\n`
        icsContent += `ACTION:DISPLAY\n`
        icsContent += `DESCRIPTION:Reminder: ${title}\n`
        icsContent += `END:VALARM\n`
        icsContent += `END:VEVENT\n`
      }
    })

    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transaction-${transaction.id}-calendar.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="clay-element border-0" id="transaction-details">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Transaction Details</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="clay-element border-0">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="clay-element clay-accent-mint border-0">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="clay-element border-0">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Details
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
        {!isEditing ? (
          <>
            <InfoItem label="Property Type" value={transaction.property_type?.replace(/_/g, " ")} />
            <InfoItem label="Agent Side" value={transaction.agent_side?.replace(/_/g, " ")} />
            <InfoItem label="Escrow #" value={transaction.escrow_number} />
            <InfoItem label="APN #" value={transaction.apn_number} />
            <InfoItem
              label="Sales Price"
              value={transaction.sales_price ? formatCurrency(transaction.sales_price) : "N/A"}
            />
            <InfoItem label="EMD">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">
                  {transaction.emd_amount ? formatCurrency(transaction.emd_amount) : "N/A"}
                </p>
                {transaction.emd_percentage && <p className="text-sm text-gray-500">({transaction.emd_percentage}%)</p>}
              </div>
            </InfoItem>
            <InfoItem
              label="Commission (Listing)"
              value={transaction.commission_listing ? formatCurrency(transaction.commission_listing) : "N/A"}
            />
            <InfoItem
              label="Commission (Buyer)"
              value={transaction.commission_buyer ? formatCurrency(transaction.commission_buyer) : "N/A"}
            />
            <InfoItem label="Property SF" value={transaction.property_sf?.toLocaleString() || "N/A"} />
            <InfoItem label="Lot SF" value={transaction.property_lot_sf?.toLocaleString() || "N/A"} />
            <InfoItem label="Year Built" value={transaction.year_built || "N/A"} />
            <InfoItem
              label="Home Warranty"
              value={transaction.home_warranty_amount ? formatCurrency(transaction.home_warranty_amount) : "N/A"}
            />
            <InfoItem label="Document Storage">
              {transaction.drive_link ? (
                <a
                  href={transaction.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  Open Drive <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <p className="font-semibold mt-1 text-gray-800">Not Linked</p>
              )}
            </InfoItem>
          </>
        ) : (
          <>
            <EditItem label="Property Type">
              <Select value={editData.property_type || ""} onValueChange={(v) => handleInputChange("property_type", v)}>
                <SelectTrigger className="clay-element border-0 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condominium">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_2_4">Multi (2-4)</SelectItem>
                  <SelectItem value="multi_5_plus">Multi (5+)</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </EditItem>

            <EditItem label="Agent Side">
              <Select value={editData.agent_side || ""} onValueChange={(v) => handleInputChange("agent_side", v)}>
                <SelectTrigger className="clay-element border-0 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="seller_side">Seller Side</SelectItem>
                  <SelectItem value="buyer_side">Buyer Side</SelectItem>
                  <SelectItem value="both_sides">Both Sides</SelectItem>
                  <SelectItem value="landlord_side">Landlord Side</SelectItem>
                  <SelectItem value="tenant_side">Tenant Side</SelectItem>
                </SelectContent>
              </Select>
            </EditItem>

            <EditItem label="Escrow #">
              <DebouncedInput
                value={editData.escrow_number || ""}
                onChange={(v: any) => handleInputChange("escrow_number", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <EditItem label="APN #">
              <DebouncedInput
                value={editData.apn_number || ""}
                onChange={(v: any) => handleInputChange("apn_number", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <div className="col-span-2">
              <EditItem label="Property Address">
                <div className="relative">
                  <DebouncedInput
                    value={editData.property_address || ""}
                    onChange={(v: any) => handleInputChange("property_address", v)}
                    className="clay-element border-0 mt-1"
                  />
                  {geocoding && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </EditItem>
            </div>

            <EditItem label="Sales Price">
              <CurrencyInput
                value={editData.sales_price || ""}
                onChange={(value: any) => handleInputChange("sales_price", value)}
                className="clay-element border-0 mt-1"
                data-field="sales_price"
              />
            </EditItem>

            <EditItem label="EMD">
              <div className="flex gap-1 mt-1">
                {emdInputType === "percentage" ? (
                  <DebouncedInput
                    type="number"
                    value={editData.emd_percentage || ""}
                    onChange={(v: any) => handleInputChange("emd_percentage", v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.emd_amount || ""}
                    onChange={(value: any) => handleInputChange("emd_amount", value)}
                    className="clay-element border-0"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="clay-element border-0"
                  onClick={() => setEmdInputType((p) => (p === "percentage" ? "flat" : "percentage"))}
                >
                  {emdInputType === "percentage" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Calculated: {formatCurrency(editData.emd_amount || 0)}</p>
            </EditItem>

            <EditItem label="Commission (Listing)">
              <div className="flex gap-1 mt-1">
                {listingCommInputType === "percentage" ? (
                  <DebouncedInput
                    type="number"
                    value={editData.commission_listing_percentage || ""}
                    onChange={(v: any) => handleInputChange("commission_listing_percentage", v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.commission_listing || ""}
                    onChange={(value: any) => handleInputChange("commission_listing", value)}
                    className="clay-element border-0"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="clay-element border-0"
                  onClick={() => setListingCommInputType((p) => (p === "percentage" ? "flat" : "percentage"))}
                >
                  {listingCommInputType === "percentage" ? (
                    <Percent className="w-4 h-4" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Calculated: {formatCurrency(editData.commission_listing || 0)}
              </p>
            </EditItem>

            <EditItem label="Commission (Buyer)">
              <div className="flex gap-1 mt-1">
                {buyerCommInputType === "percentage" ? (
                  <DebouncedInput
                    type="number"
                    value={editData.commission_buyer_percentage || ""}
                    onChange={(v: any) => handleInputChange("commission_buyer_percentage", v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.commission_buyer || ""}
                    onChange={(value: any) => handleInputChange("commission_buyer", value)}
                    className="clay-element border-0"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="clay-element border-0"
                  onClick={() => setBuyerCommInputType((p) => (p === "percentage" ? "flat" : "percentage"))}
                >
                  {buyerCommInputType === "percentage" ? (
                    <Percent className="w-4 h-4" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Calculated: {formatCurrency(editData.commission_buyer || 0)}</p>
            </EditItem>

            <EditItem label="Property SF">
              <DebouncedInput
                type="number"
                value={editData.property_sf || ""}
                onChange={(v: any) => handleInputChange("property_sf", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <EditItem label="Lot SF">
              <DebouncedInput
                type="number"
                value={editData.property_lot_sf || ""}
                onChange={(v: any) => handleInputChange("property_lot_sf", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <EditItem label="Year Built">
              <DebouncedInput
                type="number"
                value={editData.year_built || ""}
                onChange={(v: any) => handleInputChange("year_built", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <EditItem label="Home Warranty">
              <CurrencyInput
                value={editData.home_warranty_amount || ""}
                onChange={(value: any) => handleInputChange("home_warranty_amount", value)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            <EditItem label="Drive Link">
              <DebouncedInput
                value={editData.drive_link || ""}
                onChange={(v: any) => handleInputChange("drive_link", v)}
                className="clay-element border-0 mt-1"
              />
            </EditItem>
          </>
        )}
      </CardContent>
      <CardContent className="space-y-6">
        {STATUS_GROUPS.map((group) => {
          const datesInGroup = groupedDates[group.key]
          if (!datesInGroup || datesInGroup.length === 0) return null

          return (
            <div key={group.key}>
              <h4 className="font-semibold text-md mb-2 text-gray-500">{group.title}</h4>
              <div className="space-y-3">
                {datesInGroup.map((dateItem) => {
                  const statusInfo = getStatusInfo(dateItem.status, dateItem.date)
                  const isUrgent =
                    dateItem.daysRemaining !== null &&
                    dateItem.daysRemaining >= 0 &&
                    dateItem.daysRemaining <= 2 &&
                    dateItem.status !== "completed" &&
                    dateItem.status !== "waived"

                  return (
                    <div
                      key={dateItem.key}
                      className={`tooltip p-3 rounded-xl cursor-pointer transition-all ${isUrgent ? "clay-element shadow-lg" : ""}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusInfo.color}`}>
                            <statusInfo.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{dateItem.label}</p>
                            <p className="text-sm text-gray-500">
                              {dateItem.date ? format(dateItem.date, "MMM d, yyyy") : "TBD"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {dateItem.daysRemaining !== null &&
                            dateItem.status !== "completed" &&
                            dateItem.status !== "waived" && (
                              <p
                                className={`text-sm font-semibold ${dateItem.daysRemaining < 0 ? "text-red-500" : "text-blue-600"}`}
                              >
                                {dateItem.daysRemaining < 0
                                  ? `${-dateItem.daysRemaining} days overdue`
                                  : `${dateItem.daysRemaining} days left`}
                              </p>
                            )}
                        </div>
                      </div>
                      {/* Tooltip for notes */}
                      {dateItem.notes && (
                        <div className="tooltip-content text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <strong>Notes:</strong>
                          <br />
                          {dateItem.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="flex gap-2">
          {" "}
          {/* Group buttons to prevent overlap on smaller screens */}
          <Button
            onClick={generateTransactionCalendar}
            variant="outline"
            size="sm"
            className="clay-element border-0 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
