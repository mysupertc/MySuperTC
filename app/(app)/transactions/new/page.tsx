"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Loader2, Plus, Upload, Building, Percent, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Transaction, Contact, DisclosureTemplate, TaskTemplate, DisclosureItem, TaskItem } from "@/lib/api/entities"
import { fetchMLSData, geocodeAddress } from "@/lib/api/functions"
import { UploadFile } from "@/lib/api/integrations"
import Contacts from "@/components/transactions/Contacts"
import { Badge } from "@/components/ui/badge"

const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === "" || value === null || value === undefined) return ""
  const numericValue = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""))
  if (isNaN(numericValue)) return ""
  return `$${numericValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

const parseCurrency = (value: string | number | null | undefined): string => {
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

  return <Input {...props} type={type} value={localValue || ""} onChange={handleChange} />
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"search" | "off-market" | "confirm">("search")
  const [mlsNumber, setMlsNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [geocoding, setGeocoding] = useState(false)

  const [newTransaction, setNewTransaction] = useState({
    ListingKey: "",
    StreetAddress: "",
    Suite: "",
    City: "",
    StateAbbrv: "CA",
    Zip: "",
    AssessorParcelNumber: "",
    LivingArea: "",
    LotSizeArea: "",
    YearBuilt: "",
    ListPrice: "",
    Beds: "",
    BathsTotal: "",
    ComplexName: "",
    PictureUrl: "",
    County: "",
    PropertySubType: "single_family",
    agent_side: "",
    status: "prospecting",
    sales_price: "",
    commission_listing: "",
    commission_listing_percentage: "",
    commission_buyer: "",
    commission_buyer_percentage: "",
    emd_amount: "",
    emd_percentage: "",
    home_warranty_amount: "",
    escrow_number: "",
    original_contract_date: "",
    offer_acceptance_date: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [contacts, setContacts] = useState<any[]>([])
  const [emdInputType, setEmdInputType] = useState<"percentage" | "flat">("percentage")
  const [listingCommInputType, setListingCommInputType] = useState<"percentage" | "flat">("percentage")
  const [buyerCommInputType, setBuyerCommInputType] = useState<"percentage" | "flat">("percentage")
  const [listingAgents, setListingAgents] = useState<any[]>([])
  const [coListingAgents, setCoListingAgents] = useState<any[]>([])

  const getMatchingPropertyType = (mlsPropertyType: string | null) => {
    if (!mlsPropertyType) return "single_family"

    const type = mlsPropertyType.toLowerCase()

    if (type.includes("single family") || type.includes("sfr") || type.includes("detached")) return "single_family"
    if (type.includes("condo") || type.includes("condominium")) return "condominium"
    if (type.includes("townhouse") || type.includes("town house") || type.includes("attached")) return "townhouse"
    if (
      type.includes("multi") &&
      (type.includes("2-4") ||
        type.includes("2 to 4") ||
        type.includes("duplex") ||
        type.includes("triplex") ||
        type.includes("fourplex"))
    )
      return "multi_2_4"
    if (type.includes("multi") && (type.includes("5+") || type.includes("5 or more") || type.includes("apartment")))
      return "multi_5_plus"
    if (type.includes("commercial") || type.includes("office") || type.includes("retail")) return "commercial"

    return "single_family"
  }

  const searchMLS = async () => {
    if (!mlsNumber.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetchMLSData({ mlsNumber: mlsNumber.trim() })

      if (response.data.success) {
        const data = response.data.data
        const matchedPropertyType = getMatchingPropertyType(data.PropertySubType)

        const fullAddress = [data.StreetAddress, data.City, data.StateAbbrv, data.Zip].filter(Boolean).join(", ")
        let geoLat = null
        let geoLong = null

        if (fullAddress.length > 10) {
          setGeocoding(true)
          try {
            const geoResponse = await geocodeAddress({ address: fullAddress })
            if (geoResponse.data.success) {
              geoLat = geoResponse.data.latitude
              geoLong = geoResponse.data.longitude
            }
          } catch (geoError) {
            console.error("Initial geocoding for MLS data failed:", geoError)
          } finally {
            setGeocoding(false)
          }
        }

        setNewTransaction((prev) => ({
          ...prev,
          ListingKey: data.ListingKey || "",
          StreetAddress: data.StreetAddress || "",
          Suite: data.Suite || "",
          City: data.City || "",
          StateAbbrv: data.StateAbbrv || "CA",
          Zip: data.Zip || "",
          AssessorParcelNumber: data.AssessorParcelNumber || "",
          LivingArea: data.LivingArea || "",
          LotSizeArea: data.LotSizeArea || "",
          YearBuilt: data.YearBuilt || "",
          ListPrice: data.ListPrice || "",
          Beds: data.Beds || "",
          BathsTotal: data.BathsTotal || "",
          ComplexName: data.ComplexName || "",
          PictureUrl: data.PictureUrl || "",
          County: data.County || "",
          PropertySubType: matchedPropertyType,
          latitude: geoLat,
          longitude: geoLong,
        }))

        const agents = []
        const coAgents = []

        // Listing Agent
        if (data.ListAgentFirstName && data.ListAgentLastName) {
          const listingAgentName = `${data.ListAgentFirstName} ${data.ListAgentLastName}`.trim()
          const listingAgentAddress = [
            data.ListAgentAddress1,
            data.ListAgentCity,
            data.ListAgentState,
            data.ListAgentZip,
          ]
            .filter(Boolean)
            .join(", ")
          const listingOfficeAddress = [
            data.ListOfficeAddress1,
            data.ListOfficeCity,
            data.ListOfficeState,
            data.ListOfficeZip,
          ]
            .filter(Boolean)
            .join(", ")

          agents.push({
            id: `listing-agent-${data.ListAgentLicenseNumber || listingAgentName.replace(/\s+/g, "-")}`,
            type: "listing_agent",
            name: listingAgentName,
            dre_number: data.ListAgentLicenseNumber,
            email: data.ListAgentEmail,
            cell_phone: data.ListAgentCell,
            address: listingAgentAddress,
            brokerage_name: data.ListOfficeName,
            brokerage_dre: data.ListOfficeLicenseNumber,
            brokerage_phone: data.ListOfficePhone,
            brokerage_address: listingOfficeAddress,
          })
        }

        // Co-Listing Agent
        if (data.CoListAgentFirstName && data.CoListAgentLastName) {
          const coListingAgentName = `${data.CoListAgentFirstName} ${data.CoListAgentLastName}`.trim()
          const coListingAgentAddress = [
            data.CoListAgentAddress1,
            data.CoListAgentCity,
            data.CoListAgentState,
            data.CoListAgentZip,
          ]
            .filter(Boolean)
            .join(", ")
          const coListingOfficeAddress = [
            data.CoListOfficeAddress1,
            data.CoListOfficeCity,
            data.CoListOfficeState,
            data.CoListOfficeZip,
          ]
            .filter(Boolean)
            .join(", ")

          coAgents.push({
            id: `co-listing-agent-${data.CoListAgentLicenseNumber || coListingAgentName.replace(/\s+/g, "-")}`,
            type: "co_listing_agent",
            name: coListingAgentName,
            dre_number: data.CoListAgentLicenseNumber,
            email: data.CoListAgentEmail,
            cell_phone: data.CoListAgentCell,
            address: coListingAgentAddress,
            brokerage_name: data.CoListOfficeName,
            brokerage_dre: data.CoListOfficeLicenseNumber,
            brokerage_phone: data.CoListOfficePhone,
            brokerage_address: coListingOfficeAddress,
          })
        }

        setListingAgents(agents)
        setCoListingAgents(coAgents)
        setMode("confirm")
      } else {
        setError(response.data.error || "No property found with this MLS number")
      }
    } catch (err: any) {
      setError(`Error fetching property data: ${err.message}`)
      console.error("MLS Data Processing Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOffMarketMode = () => {
    setNewTransaction((prev) => ({
      ...prev,
      ListingKey: "",
      StreetAddress: "",
      Suite: "",
      City: "",
      StateAbbrv: "CA",
      Zip: "",
      AssessorParcelNumber: "",
      LivingArea: "",
      LotSizeArea: "",
      YearBuilt: "",
      ListPrice: "",
      Beds: "",
      BathsTotal: "",
      ComplexName: "",
      PictureUrl: "",
      County: "",
      PropertySubType: getMatchingPropertyType(null),
      latitude: null,
      longitude: null,
    }))
    setMode("confirm")
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const uploadResponse = await UploadFile({ file })
      setNewTransaction((prev) => ({ ...prev, PictureUrl: uploadResponse.file_url }))
    } catch (error) {
      setError("Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionPropertyChange = async (field: string, value: string) => {
    setNewTransaction((prev) => ({ ...prev, [field]: value }))

    if (["StreetAddress", "City", "StateAbbrv", "Zip"].includes(field)) {
      const updatedDataForGeocode = { ...newTransaction, [field]: value }
      const fullAddress = [
        updatedDataForGeocode.StreetAddress,
        updatedDataForGeocode.City,
        updatedDataForGeocode.StateAbbrv,
        updatedDataForGeocode.Zip,
      ]
        .filter(Boolean)
        .join(", ")

      if (fullAddress.length > 10) {
        setGeocoding(true)
        try {
          const response = await geocodeAddress({ address: fullAddress })
          if (response.data.success) {
            setNewTransaction((prev) => ({
              ...prev,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            }))
          }
        } catch (error) {
          console.error("Geocoding failed:", error)
        } finally {
          setGeocoding(false)
        }
      }
    }
  }

  const handleContractDataChange = (field: string, value: string) => {
    setNewTransaction((prev) => {
      const updatedData = { ...prev, [field]: value }
      const salesPrice = Number.parseFloat(parseCurrency(updatedData.sales_price)) || 0

      if (field === "emd_percentage") {
        if (salesPrice > 0 && Number.parseFloat(value) >= 0) {
          updatedData.emd_amount = ((salesPrice * Number.parseFloat(value)) / 100).toString()
        } else {
          updatedData.emd_amount = ""
        }
      } else if (field === "emd_amount") {
        if (salesPrice > 0 && Number.parseFloat(parseCurrency(value)) >= 0) {
          updatedData.emd_percentage = ((Number.parseFloat(parseCurrency(value)) / salesPrice) * 100).toString()
        } else {
          updatedData.emd_percentage = ""
        }
      }

      if (field === "commission_listing_percentage") {
        if (salesPrice > 0 && Number.parseFloat(value) >= 0) {
          updatedData.commission_listing = ((salesPrice * Number.parseFloat(value)) / 100).toString()
        } else {
          updatedData.commission_listing = ""
        }
      } else if (field === "commission_listing") {
        if (salesPrice > 0 && Number.parseFloat(parseCurrency(value)) >= 0) {
          updatedData.commission_listing_percentage = (
            (Number.parseFloat(parseCurrency(value)) / salesPrice) *
            100
          ).toString()
        } else {
          updatedData.commission_listing_percentage = ""
        }
      }

      if (field === "commission_buyer_percentage") {
        if (salesPrice > 0 && Number.parseFloat(value) >= 0) {
          updatedData.commission_buyer = ((salesPrice * Number.parseFloat(value)) / 100).toString()
        } else {
          updatedData.commission_buyer = ""
        }
      } else if (field === "commission_buyer") {
        if (salesPrice > 0 && Number.parseFloat(parseCurrency(value)) >= 0) {
          updatedData.commission_buyer_percentage = (
            (Number.parseFloat(parseCurrency(value)) / salesPrice) *
            100
          ).toString()
        } else {
          updatedData.commission_buyer_percentage = ""
        }
      }

      if (field === "sales_price") {
        if (salesPrice > 0) {
          if (updatedData.emd_percentage)
            updatedData.emd_amount = (
              (salesPrice * Number.parseFloat(updatedData.emd_percentage || "0")) /
              100
            ).toString()
          if (updatedData.commission_listing_percentage)
            updatedData.commission_listing = (
              (salesPrice * Number.parseFloat(updatedData.commission_listing_percentage || "0")) /
              100
            ).toString()
          if (updatedData.commission_buyer_percentage)
            updatedData.commission_buyer = (
              (salesPrice * Number.parseFloat(updatedData.commission_buyer_percentage || "0")) /
              100
            ).toString()
        } else {
          if (updatedData.emd_percentage) updatedData.emd_amount = ""
          if (updatedData.commission_listing_percentage) updatedData.commission_listing = ""
          if (updatedData.commission_buyer_percentage) updatedData.commission_buyer = ""
        }
      }

      return updatedData
    })
  }

  const formatAddress = (data: any) => {
    const parts = [data.StreetAddress, data.Suite && `#${data.Suite}`, data.City, data.StateAbbrv, data.Zip].filter(
      Boolean,
    )
    return parts.join(", ")
  }

  const handleCreateTransaction = async () => {
    if (!newTransaction.agent_side) {
      setError("Please select your representing side")
      return
    }
    if (!newTransaction.status) {
      setError("Please select property status")
      return
    }

    try {
      const cleanNumericValue = (value: string | number | null | undefined) => {
        if (value === "" || value === null || value === undefined) return null
        const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""))
        return isNaN(parsed) ? null : parsed
      }

      const transactionData = {
        property_address: formatAddress(newTransaction),
        mls_number: newTransaction.ListingKey,
        apn_number: newTransaction.AssessorParcelNumber,
        property_type: newTransaction.PropertySubType || "single_family",
        year_built: cleanNumericValue(newTransaction.YearBuilt),
        property_sf: cleanNumericValue(newTransaction.LivingArea),
        property_lot_sf: cleanNumericValue(newTransaction.LotSizeArea),
        property_image_url: newTransaction.PictureUrl,
        latitude: newTransaction.latitude,
        longitude: newTransaction.longitude,
        agent_side: newTransaction.agent_side,
        status: newTransaction.status,
        sales_price: cleanNumericValue(newTransaction.sales_price),
        commission_listing: cleanNumericValue(newTransaction.commission_listing),
        commission_listing_percentage: cleanNumericValue(newTransaction.commission_listing_percentage),
        commission_buyer: cleanNumericValue(newTransaction.commission_buyer),
        commission_buyer_percentage: cleanNumericValue(newTransaction.commission_buyer_percentage),
        emd_amount: cleanNumericValue(newTransaction.emd_amount),
        emd_percentage: cleanNumericValue(newTransaction.emd_percentage),
        home_warranty_amount: cleanNumericValue(newTransaction.home_warranty_amount),
        escrow_number: newTransaction.escrow_number,
        original_contract_date: newTransaction.original_contract_date,
        offer_acceptance_date: newTransaction.offer_acceptance_date,
      }

      const createdTransaction = await Transaction.create(transactionData)

      const disclosureTemplates = await DisclosureTemplate.list()
      if (disclosureTemplates.length > 0) {
        const filteredTemplates = disclosureTemplates.filter((template: any) => {
          if (!template.property_type_conditions || template.property_type_conditions.length === 0) {
            return true
          }
          return template.property_type_conditions.includes(createdTransaction.property_type)
        })

        const newDisclosureItems = filteredTemplates.map((template: any) => ({
          transaction_id: createdTransaction.id,
          section: template.section,
          document_name: template.document_name,
          order_index: template.order_index,
          notes: template.notes,
          no_seller_buyer: template.no_seller_buyer,
        }))
        await DisclosureItem.bulkCreate(newDisclosureItems)
      }

      const taskTemplates = await TaskTemplate.list()
      if (taskTemplates.length > 0) {
        const newTaskItems = taskTemplates.map((template: any) => ({
          transaction_id: createdTransaction.id,
          section: template.section,
          task_name: template.task_name,
          order_index: template.order_index,
        }))
        await TaskItem.bulkCreate(newTaskItems)
      }

      const allContactsToCreate = [...contacts]

      // Add listing agents from MLS data
      for (const agent of [...listingAgents, ...coListingAgents]) {
        const isAgentDuplicate = allContactsToCreate.some(
          (c) =>
            (c.email && agent.email && c.email.toLowerCase() === agent.email.toLowerCase()) ||
            (c.dre_number && agent.dre_number && c.dre_number.toLowerCase() === agent.dre_number.toLowerCase()),
        )

        if (!isAgentDuplicate) {
          allContactsToCreate.push({
            contact_type: "seller_agent",
            name: agent.name,
            dre_number: agent.dre_number,
            email: agent.email,
            cell_phone: agent.cell_phone,
            address: agent.address,
            notes:
              agent.type === "co_listing_agent"
                ? "Co-Listing Agent (Auto-populated from MLS)"
                : "Listing Agent (Auto-populated from MLS)",
          })
        }

        // Add brokerage contact if available
        if (agent.brokerage_name) {
          const isBrokerageDuplicate = allContactsToCreate.some(
            (c) =>
              c.name &&
              agent.brokerage_name &&
              c.name.toLowerCase() === agent.brokerage_name.toLowerCase() &&
              c.contact_type === "seller_brokerage",
          )

          if (!isBrokerageDuplicate) {
            allContactsToCreate.push({
              contact_type: "seller_brokerage",
              name: agent.brokerage_name,
              dre_number: agent.brokerage_dre,
              office_phone: agent.brokerage_phone,
              address: agent.brokerage_address,
              notes:
                agent.type === "co_listing_agent"
                  ? "Co-Listing Brokerage (Auto-populated from MLS)"
                  : "Listing Brokerage (Auto-populated from MLS)",
            })
          }
        }
      }

      // Create all contacts
      for (const contact of allContactsToCreate) {
        await Contact.create({
          ...contact,
          transaction_id: createdTransaction.id,
        })
      }

      router.push(`/transactions/${createdTransaction.id}`)
    } catch (error: any) {
      console.error("Error creating transaction:", error)
      setError("Error creating transaction. Please try again.")
    }
  }

  if (mode === "search") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/transactions">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">New Transaction</h1>
            <p className="text-muted-foreground">Choose how to add your property</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Search className="w-6 h-6 text-indigo-600" />
                MLS Property Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MLS Number</Label>
                <Input
                  placeholder="Enter MLS number"
                  value={mlsNumber}
                  onChange={(e) => setMlsNumber(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchMLS()}
                />
              </div>

              <Button onClick={searchMLS} disabled={loading || !mlsNumber.trim()} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching Property...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Property
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building className="w-6 h-6 text-purple-600" />
                Off-Market Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Add property details manually for off-market or pocket listings.</p>

              <Button onClick={handleOffMarketMode} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Off-Market Property
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      </div>
    )
  }

  if (mode === "confirm") {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => setMode("search")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Review Property Details</h1>
            <p className="text-muted-foreground">Confirm and edit the information before creating your transaction</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <img
                    src={
                      newTransaction.PictureUrl ||
                      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt="Property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Street Address</Label>
                  <DebouncedInput
                    value={newTransaction.StreetAddress}
                    onChange={(v: string) => handleTransactionPropertyChange("StreetAddress", v)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <DebouncedInput
                    value={newTransaction.City}
                    onChange={(v: string) => handleTransactionPropertyChange("City", v)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <DebouncedInput
                    value={newTransaction.StateAbbrv}
                    onChange={(v: string) => handleTransactionPropertyChange("StateAbbrv", v)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <DebouncedInput
                    value={newTransaction.Zip}
                    onChange={(v: string) => handleTransactionPropertyChange("Zip", v)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select
                    value={newTransaction.PropertySubType || ""}
                    onValueChange={(value) => handleTransactionPropertyChange("PropertySubType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condominium">Condominium</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_2_4">Multi-Family (2-4 Units)</SelectItem>
                      <SelectItem value="multi_5_plus">Multi-Family (5+ Units)</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Representing Side *</Label>
                  <Select
                    value={newTransaction.agent_side}
                    onValueChange={(value) => handleContractDataChange("agent_side", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller_side">Seller Side</SelectItem>
                      <SelectItem value="buyer_side">Buyer Side</SelectItem>
                      <SelectItem value="both_sides">Both Sides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Property Status *</Label>
                  <Select
                    value={newTransaction.status}
                    onValueChange={(value) => handleContractDataChange("status", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospecting">Prospecting</SelectItem>
                      <SelectItem value="active_contingent">Active (Contingent)</SelectItem>
                      <SelectItem value="active_noncontingent">Active (Non-contingent)</SelectItem>
                      <SelectItem value="pre_listing">Pre-Listing</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sale Price</Label>
                  <CurrencyInput
                    placeholder="$0"
                    value={newTransaction.sales_price}
                    onChange={(value: string) => handleContractDataChange("sales_price", value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>EMD</Label>
                  <div className="flex gap-1 mt-1">
                    {emdInputType === "percentage" ? (
                      <DebouncedInput
                        type="number"
                        placeholder="%"
                        value={newTransaction.emd_percentage}
                        onChange={(v: string) => handleContractDataChange("emd_percentage", v)}
                      />
                    ) : (
                      <CurrencyInput
                        placeholder="$0"
                        value={newTransaction.emd_amount}
                        onChange={(value: string) => handleContractDataChange("emd_amount", value)}
                      />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setEmdInputType((p) => (p === "percentage" ? "flat" : "percentage"))}
                    >
                      {emdInputType === "percentage" ? (
                        <Percent className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(listingAgents.length > 0 || coListingAgents.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>MLS Listing Agents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listingAgents.map((agent) => (
                    <div key={agent.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{agent.name}</h4>
                        <Badge>Listing Agent</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {agent.dre_number && (
                          <div>
                            <span className="text-muted-foreground">DRE#:</span> {agent.dre_number}
                          </div>
                        )}
                        {agent.email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span> {agent.email}
                          </div>
                        )}
                        {agent.cell_phone && (
                          <div>
                            <span className="text-muted-foreground">Phone:</span> {agent.cell_phone}
                          </div>
                        )}
                        {agent.address && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Address:</span> {agent.address}
                          </div>
                        )}
                      </div>
                      {agent.brokerage_name && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="font-medium">{agent.brokerage_name}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {agent.brokerage_dre && (
                              <div>
                                <span className="text-muted-foreground">DRE#:</span> {agent.brokerage_dre}
                              </div>
                            )}
                            {agent.brokerage_phone && (
                              <div>
                                <span className="text-muted-foreground">Phone:</span> {agent.brokerage_phone}
                              </div>
                            )}
                            {agent.brokerage_address && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Address:</span> {agent.brokerage_address}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {coListingAgents.map((agent) => (
                    <div key={agent.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{agent.name}</h4>
                        <Badge variant="secondary">Co-Listing Agent</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {agent.dre_number && (
                          <div>
                            <span className="text-muted-foreground">DRE#:</span> {agent.dre_number}
                          </div>
                        )}
                        {agent.email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span> {agent.email}
                          </div>
                        )}
                        {agent.cell_phone && (
                          <div>
                            <span className="text-muted-foreground">Phone:</span> {agent.cell_phone}
                          </div>
                        )}
                        {agent.address && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Address:</span> {agent.address}
                          </div>
                        )}
                      </div>
                      {agent.brokerage_name && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="font-medium">{agent.brokerage_name}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {agent.brokerage_dre && (
                              <div>
                                <span className="text-muted-foreground">DRE#:</span> {agent.brokerage_dre}
                              </div>
                            )}
                            {agent.brokerage_phone && (
                              <div>
                                <span className="text-muted-foreground">Phone:</span> {agent.brokerage_phone}
                              </div>
                            )}
                            {agent.brokerage_address && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Address:</span> {agent.brokerage_address}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Contacts
              contacts={contacts}
              transactionId={null}
              onUpdate={() => {}}
              isCreationMode={true}
              onContactsChange={setContacts}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => setMode("search")}>
            Back
          </Button>
          <Button
            onClick={handleCreateTransaction}
            disabled={!newTransaction.agent_side || !newTransaction.status || geocoding}
          >
            {geocoding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Geocoding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </>
            )}
          </Button>
        </div>

        {error && <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      </div>
    )
  }

  return null
}
