export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  level: number
  xp: number
  totalTrips: number
  countriesVisited: number
  monumentsCollected: number
}

export interface Trip {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  budget: number
  spent: number
  status: "planning" | "active" | "completed"
  imageUrl?: string
  description?: string
}

export interface Monument {
  id: string
  name: string
  location: string
  description: string
  imageUrl?: string
  collected: boolean
  collectedAt?: string
  xpReward: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface Trophy {
  id: string
  name: string
  description: string
  imageUrl?: string
  earnedAt: string
  category: "travel" | "culture" | "adventure" | "social"
}

export interface Activity {
  id: string
  name: string
  type: "museum" | "restaurant" | "monument" | "park" | "shopping" | "tour"
  location: string
  time: string
  duration: number
  cost: number
  booked: boolean
  notes?: string
}

export interface DayItinerary {
  date: string
  dayNumber: number
  activities: Activity[]
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  location: string
  rating: number
  priceRange: "€" | "€€" | "€€€" | "€€€€"
  booked: boolean
  reservationTime?: string
}

export interface Destination {
  id: string
  name: string
  country: string
  description: string
  imageColor: string
  rating: number
  category: string[]
}
