"use server"

export async function getMapboxToken() {
  // Mapbox public tokens (pk.*) are designed for client-side use
  // This server action provides the token to client components
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || null
}
