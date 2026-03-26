"use client"

import { useState, useEffect, useRef } from "react"

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
const GOOGLE_PLACES_PHOTO_ENABLED = !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

// In-memory cache to avoid refetching across re-renders
const imageCache = new Map<string, string | null>()

/**
 * Fetch a real photo for an activity.
 * 
 * Priority:
 * 1. Google Places Photos API (if NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is set)
 * 2. Wikipedia page image (free, no key needed)
 * 3. null → component shows gradient fallback
 */
export function useActivityImage(query: string | undefined, name: string) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(false)

  useEffect(() => {
    const searchTerm = query || name
    if (!searchTerm) return

    const cacheKey = searchTerm.toLowerCase().trim()
    if (imageCache.has(cacheKey)) {
      setSrc(imageCache.get(cacheKey) ?? null)
      return
    }

    abortRef.current = false
    setLoading(true)

    async function fetchImage() {
      let url: string | null = null

      // Strategy 1: Google Places Photos (if enabled)
      if (GOOGLE_PLACES_PHOTO_ENABLED) {
        url = await fetchGooglePlacesPhoto(searchTerm)
      }

      // Strategy 2: Wikipedia
      if (!url && !abortRef.current) {
        url = await fetchWikipediaImage(searchTerm)
      }

      // Strategy 3: Try with just the name if query failed
      if (!url && !abortRef.current && query && query !== name) {
        url = await fetchWikipediaImage(name)
      }

      imageCache.set(cacheKey, url)
      if (!abortRef.current) {
        setSrc(url)
        setLoading(false)
      }
    }

    fetchImage()

    return () => { abortRef.current = true }
  }, [query, name])

  return { src, loading }
}

// ─── Wikipedia ────────────────────────────────────────────────────────────────

async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  try {
    // Step 1: Search for the page
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      gsrsearch: searchTerm,
      generator: "search",
      gsrlimit: "1",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "800",
    })

    const res = await fetch(`${WIKIPEDIA_API}?${searchParams}`)
    if (!res.ok) return null

    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null

    // Get the first page's thumbnail
    const page = Object.values(pages)[0] as { thumbnail?: { source?: string } }
    const thumbUrl = page?.thumbnail?.source

    if (thumbUrl) return thumbUrl

    // Step 2: If no thumbnail, try getting the main image via pageimages with original
    const pageId = Object.keys(pages)[0]
    const imgParams = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      pageids: pageId,
      prop: "pageimages",
      piprop: "original",
    })

    const imgRes = await fetch(`${WIKIPEDIA_API}?${imgParams}`)
    if (!imgRes.ok) return null

    const imgData = await imgRes.json()
    const imgPage = Object.values(imgData.query?.pages ?? {})[0] as { original?: { source?: string } }
    return imgPage?.original?.source ?? null
  } catch {
    return null
  }
}

// ─── Google Places (upgrade path) ─────────────────────────────────────────────

async function fetchGooglePlacesPhoto(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  try {
    // Find Place
    const findParams = new URLSearchParams({
      input: searchTerm,
      inputtype: "textquery",
      fields: "photos",
      key: apiKey,
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${findParams}`
    )
    if (!res.ok) return null

    const data = await res.json()
    const photoRef = data.candidates?.[0]?.photos?.[0]?.photo_reference
    if (!photoRef) return null

    // Return photo URL (maxwidth controls size/cost)
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`
  } catch {
    return null
  }
}
