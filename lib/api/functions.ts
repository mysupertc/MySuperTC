"use client"

export async function geocodeAddress({ address }: { address: string }) {
  try {
    // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "User-Agent": "MySuperTC/1.0", // Required by Nominatim
        },
      },
    )

    const data = await response.json()

    if (data && data.length > 0) {
      return {
        data: {
          success: true,
          latitude: Number.parseFloat(data[0].lat),
          longitude: Number.parseFloat(data[0].lon),
        },
      }
    }

    return {
      data: {
        success: false,
        latitude: null,
        longitude: null,
      },
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    return {
      data: {
        success: false,
        latitude: null,
        longitude: null,
      },
    }
  }
}

export async function getMapboxToken() {
  return {
    data: {
      token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || null,
    },
  }
}

export async function getGoogleAuthUrl() {
  try {
    const response = await fetch("/api/google/auth-url", {
      method: "GET",
    })
    const data = await response.json()
    return { data }
  } catch (error) {
    console.error("Error getting Google auth URL:", error)
    throw error
  }
}

export async function getGoogleCallbackUrl() {
  try {
    const response = await fetch("/api/google/callback-url", {
      method: "GET",
    })
    const data = await response.json()
    return { data }
  } catch (error) {
    console.error("Error getting Google callback URL:", error)
    return { data: { callbackUrl: "", jsOrigin: "" } }
  }
}

export async function startGmailSync() {
  try {
    const response = await fetch("/api/google/start-sync", {
      method: "POST",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "Failed to start Gmail sync")
    }
    return await response.json()
  } catch (error) {
    console.error("Error starting Gmail sync:", error)
    throw error
  }
}

export async function stopGmailSync() {
  try {
    const response = await fetch("/api/google/stop-sync", {
      method: "POST",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "Failed to stop Gmail sync")
    }
    return await response.json()
  } catch (error) {
    console.error("Error stopping Gmail sync:", error)
    throw error
  }
}

export async function fetchMLSData({ mlsNumber }: { mlsNumber: string }) {
  try {
    const response = await fetch(`/api/mls/search?mlsNumber=${encodeURIComponent(mlsNumber)}`, {
      method: "GET",
    })

    if (!response.ok) {
      return {
        data: {
          success: false,
          error: "Failed to fetch MLS data",
        },
      }
    }

    const data = await response.json()
    return {
      data: {
        success: true,
        data: data,
      },
    }
  } catch (error) {
    console.error("MLS fetch error:", error)
    return {
      data: {
        success: false,
        error: "Error fetching MLS data",
      },
    }
  }
}
