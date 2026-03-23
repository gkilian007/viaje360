import { successResponse } from "@/lib/api/route-helpers"

export async function GET() {
  try {
    // Return mock data for testing
    const mockData = {
      trip: {
        id: "trip-1",
        name: "Barcelona Adventure",
        destination: "Barcelona",
        country: "España",
        startDate: "2026-03-22",
        endDate: "2026-03-25",
        budget: 1500,
        spent: 0,
        status: "active"
      },
      days: [
        {
          date: "2026-03-22",
          dayNumber: 1,
          activities: [
            {
              id: "a1",
              name: "Check-in Hotel Arts",
              type: "hotel",
              location: "Marina",
              time: "14:00",
              duration: 60,
              cost: 0
            },
            {
              id: "a2",
              name: "Paseo por la Barceloneta",
              type: "park",
              location: "Beach",
              time: "16:00",
              duration: 90,
              cost: 0
            },
            {
              id: "a3",
              name: "Cena en El Nacional",
              type: "restaurant",
              location: "Gracia",
              time: "20:30",
              duration: 90,
              cost: 45
            }
          ]
        }
      ],
      chatMessages: []
    }

    return successResponse(mockData)
  } catch (error) {
    console.error("trips/active error:", error)
    return successResponse({ trip: null, days: [], chatMessages: [] })
  }
}