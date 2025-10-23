"use client"
import Link from "next/link"
import { Card } from "@/components/ui/card"

const getStatusColor = (status: string) => {
  switch (status) {
    case "active_contingent":
      return "eab308"
    case "active_noncontingent":
      return "3b82f6"
    case "seller_in_possession":
      return "8b5cf6"
    case "closed":
      return "6b7280"
    case "cancelled":
      return "ef4444"
    case "pre_listing":
      return "22c55e"
    case "listed":
      return "10b981"
    default:
      return "000000"
  }
}

export default function TransactionsMap({ transactions, mapboxToken }: any) {
  const transactionsWithCoords = transactions.filter((t: any) => t.latitude && t.longitude)

  if (!mapboxToken || transactionsWithCoords.length === 0) {
    return (
      <div className="h-[500px] w-full bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">No transactions with location data available</p>
      </div>
    )
  }

  // Calculate center point (average of all coordinates)
  const avgLat =
    transactionsWithCoords.reduce((sum: number, t: any) => sum + t.latitude, 0) / transactionsWithCoords.length
  const avgLng =
    transactionsWithCoords.reduce((sum: number, t: any) => sum + t.longitude, 0) / transactionsWithCoords.length

  // Create marker overlays for Mapbox Static API
  const markers = transactionsWithCoords
    .map((t: any) => {
      const color = getStatusColor(t.status)
      return `pin-s+${color}(${t.longitude},${t.latitude})`
    })
    .join(",")

  const zoom = transactionsWithCoords.length === 1 ? 13 : 10
  const width = 800
  const height = 500

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers}/${avgLng},${avgLat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`

  return (
    <div className="space-y-4">
      <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg">
        <img src={staticMapUrl || "/placeholder.svg"} alt="Transactions map" className="w-full h-full object-cover" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
          <span className="text-xs text-gray-600">Active Contingent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
          <span className="text-xs text-gray-600">Active Non-Contingent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
          <span className="text-xs text-gray-600">Seller in Possession</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#6b7280]"></div>
          <span className="text-xs text-gray-600">Closed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
          <span className="text-xs text-gray-600">Pre-Listing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
          <span className="text-xs text-gray-600">Listed</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transactionsWithCoords.map((transaction: any) => (
          <Link key={transaction.id} href={`/transactions/${transaction.id}`}>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: `#${getStatusColor(transaction.status)}` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
                    {transaction.property_address}
                  </div>
                  <div className="text-green-600 font-medium text-sm mb-1">
                    {transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : "Price TBD"}
                  </div>
                  <div className="capitalize text-gray-600 text-xs">{transaction.status.replace(/_/g, " ")}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
