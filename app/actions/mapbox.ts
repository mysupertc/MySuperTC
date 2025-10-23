"use server"

export async function getMapboxToken() {
  // Mapbox public tokens (pk.*) are designed for client-side use
  // This server action provides the token to client components while keeping the env var server-side
  return process.env.MAPBOX_TOKEN || null
}
