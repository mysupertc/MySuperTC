import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const mlsNumber = request.nextUrl.searchParams.get("mlsNumber")
  if (!mlsNumber) {
    return NextResponse.json({ success: false, error: "MLS number is required" }, { status: 400 })
  }

  try {
    const apiUrl = `https://rets2.themls.com/CLAWResoApi-v1/Property?access_token=FMRloyiDCbMmn-Vp6977XA&$filter=contains(ListingKey,'${encodeURIComponent(
      mlsNumber,
    )}')`

    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error("Failed to fetch MLS")

    const data = await res.json()
    if (data.value && data.value.length > 0) {
      return NextResponse.json({ success: true, data: data.value[0] })
    }

    return NextResponse.json({ success: false, error: "No property found" }, { status: 404 })
  } catch (err: any) {
    console.error("MLS API Error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
