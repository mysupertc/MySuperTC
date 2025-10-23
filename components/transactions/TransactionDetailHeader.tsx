import Link from "next/link"
import { createPageUrl } from "@/lib/utils"
import { ArrowLeft, Edit, MoreVertical, FileText, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TransactionDetailHeader({ transaction }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "clay-accent-mint text-green-700"
      case "pending":
        return "clay-accent-blue text-blue-700"
      case "closed":
        return "clay-accent-lavender text-purple-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="flex justify-between items-start">
      <div className="flex items-start gap-4">
        <Link href={createPageUrl("Transactions")}>
          <Button variant="outline" size="icon" className="clay-element border-0 bg-transparent">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{transaction.property_address}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={`clay-element border-0 text-sm capitalize ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </Badge>
            <span className="text-gray-500">MLS# {transaction.mls_number}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="clay-element border-0 bg-transparent">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="clay-element border-0">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="clay-element border-0">
            <DropdownMenuItem>
              <FileText className="w-4 h-4 mr-2" /> Generate Report
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" /> Edit Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
