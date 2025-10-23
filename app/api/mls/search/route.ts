import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mlsNumber = searchParams.get("mlsNumber")

  if (!mlsNumber) {
    return NextResponse.json({ success: false, error: "MLS number is required" }, { status: 400 })
  }

  try {
    const apiUrl = `https://rets2.themls.com/CLAWResoApi-v1/Property?access_token=FMRloyiDCbMmn-Vp6977XA&$filter=contains(ListingKey,'${encodeURIComponent(mlsNumber)}') and (MlsID eq 'CLAW' or MlsID eq 'SDMLS' or MlsID eq 'CRMLS' or MlsID eq 'PS' or MlsID eq 'IMPERIAL' or MlsID eq 'BridgeMLS' or MlsID eq 'ITECH' or MlsID eq 'VCRDS' or MlsID eq 'CDAR' or MlsID eq 'MLSL' or MlsID eq 'CRISNET')`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("MLS API error:", response.status, response.statusText)
      return NextResponse.json({ success: false, error: "Failed to fetch from MLS API" }, { status: response.status })
    }

    const data = await response.json()

    if (data.value && data.value.length > 0) {
      return NextResponse.json({ success: true, data: data.value[0] })
    } else {
      return NextResponse.json({ success: false, error: "No property found with this MLS number" }, { status: 404 })
    }
  } catch (error: any) {
    console.error("MLS API fetch error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
