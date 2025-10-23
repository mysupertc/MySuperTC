export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createTransactionInDB } from "@/lib/server/transactions"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const newTransaction = await createTransactionInDB(body)

    return NextResponse.json({ success: true, transaction: newTransaction })
  } catch (err: any) {
    console.error("Transaction creation failed:", err)
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
