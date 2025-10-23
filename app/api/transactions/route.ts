import { NextResponse } from "next/server"
import { createTransactionInDB } from "@/lib/server/transactions"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate essential fields
    if (!body.property_address || !body.agent_side) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: property_address or agent_side" },
        { status: 400 },
      )
    }

    const newTransaction = await createTransactionInDB(body)
    return NextResponse.json({ success: true, transaction: newTransaction })
  } catch (err: any) {
    console.error("Transaction creation failed:", err)
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
