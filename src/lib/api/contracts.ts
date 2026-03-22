import { z } from "zod"

const arrivalTimeSchema = z.enum(["morning", "afternoon", "evening", "night"])
const companionSchema = z.enum(["solo", "pareja", "familia", "amigos"])
const mobilitySchema = z.enum(["full", "moderate", "frequent-rest", "wheelchair", "reduced"])
const interestSchema = z.enum([
  "historia",
  "gastronomia",
  "playa",
  "nocturna",
  "aventura",
  "shopping",
  "fotografia",
  "arte",
  "naturaleza",
  "familiar",
  "deportes",
  "bienestar",
])
const travelerStyleSchema = z.enum(["instagrammer", "experiencial", "explorador", "cultural"])
const dietarySchema = z.enum([
  "vegetariano",
  "vegano",
  "halal",
  "kosher",
  "sin-gluten",
  "sin-lactosa",
  "ninguna",
])
const transportSchema = z.enum(["pie", "publico", "taxi", "coche", "bici", "mix"])
const kidsPetsSchema = z.enum([
  "bebe",
  "ninos",
  "pre-adolescentes",
  "perro-pequeno",
  "perro-grande",
  "otro-animal",
  "ninguno",
])
const splurgeSchema = z.enum(["comida", "experiencias", "shopping", "alojamiento", "nightlife"])
const budgetSchema = z.enum(["economico", "moderado", "premium"])
const restDayFrequencySchema = z.enum(["cada-2", "cada-3", "ultimo"])

export const onboardingRequestSchema = z.object({
  destination: z.string().trim().min(1, "Destination is required"),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().trim().min(1, "End date is required"),
  arrivalTime: arrivalTimeSchema.nullable(),
  departureTime: arrivalTimeSchema.nullable(),
  companion: companionSchema.nullable(),
  groupSize: z.number().int().min(1).max(20),
  kidsPets: z.array(kidsPetsSchema),
  mobility: mobilitySchema.nullable(),
  hasMobilityNeeds: z.boolean(),
  accommodationZone: z.string(),
  interests: z.array(interestSchema),
  travelerStyle: travelerStyleSchema.nullable(),
  famousLocal: z.number().min(0).max(100),
  pace: z.number().min(0).max(100),
  wantsRestDays: z.boolean(),
  restDayFrequency: restDayFrequencySchema.nullable(),
  wakeTime: z.number().min(0).max(100),
  wantsSiesta: z.boolean(),
  budget: budgetSchema.nullable(),
  splurge: z.array(splurgeSchema),
  dietary: z.array(dietarySchema),
  allergies: z.string(),
  transport: z.array(transportSchema),
  weatherAdaptation: z.boolean(),
  firstTime: z.boolean().nullable(),
  mustSee: z.string(),
  mustAvoid: z.string(),
  alreadyBooked: z.string(),
})

export const generatedActivitySchema = z.object({
  name: z.string(),
  type: z.string(),
  location: z.string().default(""),
  address: z.string().optional(),
  time: z.string(),
  endTime: z.string().optional(),
  duration: z.number(),
  cost: z.number(),
  notes: z.string().optional(),
  icon: z.string().optional(),
  indoor: z.boolean().optional(),
  weatherDependent: z.boolean().optional(),
  kidFriendly: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  dietaryTags: z.array(z.string()).optional(),
})

export const generatedDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string(),
  theme: z.string(),
  isRestDay: z.boolean(),
  activities: z.array(generatedActivitySchema),
})

export const generatedItinerarySchema = z.object({
  tripName: z.string(),
  days: z.array(generatedDaySchema),
})

export const tripSchema = z.object({
  id: z.string(),
  name: z.string(),
  destination: z.string(),
  country: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number(),
  spent: z.number(),
  status: z.enum(["planning", "active", "completed"]),
  currentActivity: z.string().optional(),
  weather: z
    .object({
      temp: z.number(),
      condition: z.string(),
      icon: z.string(),
      humidity: z.number(),
      wind: z.number(),
    })
    .optional(),
})

export const timelineActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["museum", "restaurant", "monument", "park", "shopping", "tour", "hotel", "transport"]),
  location: z.string(),
  time: z.string(),
  duration: z.number(),
  cost: z.number(),
  booked: z.boolean(),
  notes: z.string().optional(),
  icon: z.string().optional(),
})

export const dayItinerarySchema = z.object({
  date: z.string(),
  dayNumber: z.number().int().positive(),
  activities: z.array(timelineActivitySchema),
})

export const chatHistoryItemSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string(),
})

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message required"),
  history: z.array(chatHistoryItemSchema).optional().default([]),
  tripId: z.string().trim().min(1).optional(),
})

export const adaptRequestSchema = z.object({
  tripId: z.string().trim().min(1, "tripId is required"),
  reason: z.string().trim().min(1, "reason is required"),
})

export const placesSearchRequestSchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  location: z.string().trim().min(1, "location is required"),
  filters: z
    .object({
      kidFriendly: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
      dietary: z.array(z.string()).optional(),
      accessible: z.boolean().optional(),
      type: z.string().optional(),
    })
    .optional(),
})

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
  days: z.coerce.number().int().min(1).max(14).default(7),
})

export const quizAwardRequestSchema = z.object({
  xpReward: z.number().int().min(0).default(50),
})
