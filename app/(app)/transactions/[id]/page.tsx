"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Transaction, Contact, DisclosureItem, TaskItem } from "@/lib/api/entities"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getMapboxToken } from "@/app/actions/mapbox"

import ActiveTransactionsSlider from "@/components/transactions/ActiveTransactionsSlider"
import TransactionDetailHeader from "@/components/transactions/TransactionDetailHeader"
import TransactionInfo from "@/components/transactions/TransactionInfo"
import ImportantDates from "@/components/transactions/ImportantDates"
import Checklist from "@/components/transactions/Checklist"
import Contacts from "@/components/transactions/Contacts"
import TransactionLocationMap from "@/components/transactions/TransactionLocationMap"
import TransactionTimeline from "@/components/transactions/TransactionTimeline"
import TransactionCalendarGrid from "@/components/transactions/TransactionCalendarGrid"
import EmailMailbox from "@/components/transactions/EmailMailbox"
import FloatingEmailWidget from "@/components/email/FloatingEmailWidget"

const isDisclosureCompleted = (item: any) => {
  return (
    (item.seller_signed && item.buyer_signed) ||
    (item.seller_signed && item.no_seller_buyer) ||
    (item.buyer_signed && item.no_seller_buyer) ||
    (item.no_seller_buyer && !item.seller_signed && !item.buyer_signed && item.document_name === "N/A")
  )
}

const isTaskCompleted = (item: any) => {
  return item.completed
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string

  const [transaction, setTransaction] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [disclosureItems, setDisclosureItems] = useState<any[]>([])
  const [taskItems, setTaskItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollToSalesPrice, setScrollToSalesPrice] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("timeline")
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  const geocodeAddress = useCallback(async (address: string, token: string) => {
    if (!address || !token) {
      console.warn("Address or Mapbox token missing for geocoding.")
      return null
    }
    const encodedAddress = encodeURIComponent(address)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}`,
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center
        return { latitude, longitude }
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
    }
    return null
  }, [])

  const loadAllData = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const [transactionData, contactsData, disclosuresData, tasksData, token] = await Promise.all([
        Transaction.get(id),
        Contact.filter({ transaction_id: id }),
        DisclosureItem.filter({ transaction_id: id }, "order_index"),
        TaskItem.filter({ transaction_id: id }, "order_index"),
        getMapboxToken(),
      ])
      setTransaction(transactionData)
      setContacts(contactsData)
      setDisclosureItems(disclosuresData)
      setTaskItems(tasksData)
      setMapboxToken(token)
    } catch (error) {
      console.error("Error loading transaction details:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTransactionUpdate = async (updatedData: any) => {
    if (!transactionId) return

    const dataToUpdate = { ...updatedData }

    const addressFields = ["street_address", "city", "state", "zip_code"]
    const addressChanged =
      transaction &&
      addressFields.some((field) => updatedData.hasOwnProperty(field) && updatedData[field] !== transaction[field])

    if (addressChanged && mapboxToken) {
      const currentStreet =
        updatedData.street_address !== undefined ? updatedData.street_address : transaction.street_address
      const currentCity = updatedData.city !== undefined ? updatedData.city : transaction.city
      const currentState = updatedData.state !== undefined ? updatedData.state : transaction.state
      const currentZip = updatedData.zip_code !== undefined ? updatedData.zip_code : transaction.zip_code

      const fullAddress = [currentStreet, currentCity, currentState, currentZip].filter(Boolean).join(", ")

      if (fullAddress.trim()) {
        const geoData = await geocodeAddress(fullAddress, mapboxToken)
        if (geoData) {
          dataToUpdate.latitude = geoData.latitude
          dataToUpdate.longitude = geoData.longitude
        } else {
          console.warn("Geocoding failed for address:", fullAddress)
        }
      } else {
        dataToUpdate.latitude = null
        dataToUpdate.longitude = null
      }
    }

    await Transaction.update(transactionId, dataToUpdate)
    setTransaction((prev: any) => ({ ...prev, ...dataToUpdate }))
  }

  const handleDataExtracted = async (extractedData: any) => {
    await handleTransactionUpdate(extractedData)
  }

  const pendingDisclosuresCount = useMemo(
    () => disclosureItems.filter((item) => !isDisclosureCompleted(item)).length,
    [disclosureItems],
  )

  const pendingTasksCount = useMemo(() => taskItems.filter((item) => !item.completed).length, [taskItems])

  const handleScrollToTransactionDetails = () => {
    setScrollToSalesPrice(true)
    setTimeout(() => {
      const element = document.getElementById("transaction-details")
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      setTimeout(() => setScrollToSalesPrice(false), 1000)
    }, 100)
  }

  useEffect(() => {
    if (transactionId && transactionId !== "new") {
      loadAllData(transactionId)
    } else {
      setLoading(false)
    }
  }, [transactionId, loadAllData])

  if (transactionId === "new") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to new transaction page...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold">Transaction not found</h2>
        <p className="text-gray-600 mb-6">Could not find the requested transaction. It may have been deleted.</p>
        <Link href="/transactions">
          <Button className="clay-element clay-accent-mint border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>
      </div>
    )
  }

  const disclosureSections = [
    { title: "Purchase Agreement & Counters", key: "purchase_agreement" },
    { title: "Disclosures", key: "disclosures" },
    { title: "Broker Disclosures", key: "broker_disclosures" },
    ...(transaction.agent_side === "seller_side" || transaction.agent_side === "both_sides"
      ? [{ title: "Listing Agreement", key: "listing_agreement" }]
      : []),
  ]

  const disclosureColumns = [
    { title: "Prepared", type: "checkbox", key: "prepared" },
    { title: "Document", type: "text", key: "document_name" },
    { title: "Seller", type: "checkbox", key: "seller_signed" },
    { title: "Buyer", type: "checkbox", key: "buyer_signed" },
    { title: "No Seller/Buyer", type: "checkbox", key: "no_seller_buyer" },
    { title: "Notes", type: "text", key: "notes" },
  ]

  const taskSections = [
    { title: "Agent/Broker Checklist", key: "agent_broker" },
    { title: "Escrow & Title Checklist", key: "escrow_title" },
  ]

  const taskColumns = [
    { title: "Task", type: "text", key: "task_name" },
    { title: "Due Date", type: "date", key: "due_date" },
    { title: "Completed", type: "checkbox", key: "completed" },
    { title: "Notes", type: "text", key: "notes" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {showEmailComposer && (
        <FloatingEmailWidget
          autoOpenDraft={true}
          draftData={{ transactionId: transactionId }}
          onClose={() => setShowEmailComposer(false)}
        />
      )}
      <ActiveTransactionsSlider />

      <TransactionDetailHeader transaction={transaction} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TransactionInfo
            transaction={transaction}
            onUpdate={handleTransactionUpdate}
            scrollToSalesPrice={scrollToSalesPrice}
          />

          <div id="disclosures-checklist">
            <Checklist
              title="Disclosures Checklist"
              items={disclosureItems}
              ItemEntity={DisclosureItem}
              transactionId={transactionId}
              sections={disclosureSections}
              columns={disclosureColumns}
              onUpdate={() => loadAllData(transactionId)}
              completionLogic={isDisclosureCompleted}
            />
          </div>

          <div id="tasks-checklist">
            <Checklist
              title="Task Checklist"
              items={taskItems}
              ItemEntity={TaskItem}
              transactionId={transactionId}
              sections={taskSections}
              columns={taskColumns}
              onUpdate={() => loadAllData(transactionId)}
              completionLogic={isTaskCompleted}
            />
          </div>
        </div>

        <div className="space-y-8">
          <ImportantDates transaction={transaction} onUpdate={handleTransactionUpdate} transactionId={transactionId} />

          <div className="clay-element border-0 p-4">
            <div className="flex justify-center mb-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className="text-sm px-4"
                >
                  Timeline
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className="text-sm px-4"
                >
                  Calendar
                </Button>
              </div>
            </div>

            {viewMode === "timeline" ? (
              <TransactionTimeline
                transaction={transaction}
                taskItems={taskItems}
                onUpdate={() => loadAllData(transactionId)}
              />
            ) : (
              <TransactionCalendarGrid
                transaction={transaction}
                taskItems={taskItems}
                disclosureItems={disclosureItems}
                onUpdate={() => loadAllData(transactionId)}
                transactionId={transactionId}
              />
            )}
          </div>

          <EmailMailbox transactionId={transactionId} onComposeClick={() => setShowEmailComposer(true)} />
          <TransactionLocationMap
            transaction={transaction}
            mapboxToken={mapboxToken}
            onDataExtracted={handleDataExtracted}
            offerAcceptanceDate={transaction?.offer_acceptance_date}
          />
          <Contacts contacts={contacts} transactionId={transactionId} onUpdate={() => loadAllData(transactionId)} />
        </div>
      </div>
    </div>
  )
}
