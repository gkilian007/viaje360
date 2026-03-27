export type TravelCompanion = "solo" | "pareja" | "familia" | "amigos"
export type ArrivalTime = "morning" | "afternoon" | "evening" | "night"
export type MobilityOption =
  | "full"
  | "moderate"
  | "frequent-rest"
  | "wheelchair"
  | "reduced"
export type Interest =
  | "historia"
  | "gastronomia"
  | "playa"
  | "nocturna"
  | "aventura"
  | "shopping"
  | "fotografia"
  | "arte"
  | "naturaleza"
  | "familiar"
  | "deportes"
  | "bienestar"
export type TravelerStyle = "instagrammer" | "experiencial" | "explorador" | "cultural"
export type FamousLocal = "imprescindible" | "autentico" | "mix"
export type DietaryRestriction =
  | "vegetariano"
  | "vegano"
  | "halal"
  | "kosher"
  | "sin-gluten"
  | "sin-lactosa"
  | "ninguna"
export type Transport =
  | "pie"
  | "publico"
  | "taxi"
  | "coche"
  | "bici"
  | "mix"
export type KidsPets =
  | "bebe"
  | "ninos"
  | "pre-adolescentes"
  | "perro-pequeno"
  | "perro-grande"
  | "otro-animal"
  | "ninguno"
export type SplurgeCategory =
  | "comida"
  | "experiencias"
  | "shopping"
  | "alojamiento"
  | "nightlife"
export type BudgetLevel = "economico" | "moderado" | "premium"
export type RestDayFrequency = "cada-2" | "cada-3" | "ultimo"

export interface OnboardingData {
  // Step 1: Destination + dates
  destination: string
  startDate: string
  endDate: string
  arrivalTime: ArrivalTime | null
  departureTime: ArrivalTime | null

  // Step 2: Companions
  companion: TravelCompanion | null
  groupSize: number

  // Step 3: Kids/Pets (conditional: family)
  kidsPets: KidsPets[]

  // Step 4: Mobility (conditional)
  mobility: MobilityOption | null
  hasMobilityNeeds: boolean

  // Step 5: Accommodation
  accommodationZone: string

  // Step 6: Interests
  interests: Interest[]

  // Step 7: Traveler style
  travelerStyle: TravelerStyle | null

  // Step 8: Famous vs local
  famousLocal: number // 0 = all famous, 100 = all local

  // Step 9: Pace
  pace: number // 0 = chill, 100 = intense

  // Step 10: Rest days
  wantsRestDays: boolean
  restDayFrequency: RestDayFrequency | null

  // Step 11: Day style
  wakeTime: number // 0 = early bird (7am), 100 = night owl (11am)
  wantsSiesta: boolean

  // Step 12: Budget
  budget: BudgetLevel | null

  // Step 13: Splurge
  splurge: SplurgeCategory[]

  // Step 14: Dietary
  dietary: DietaryRestriction[]
  allergies: string

  // Step 15: Transport
  transport: Transport[]

  // Step 16: Weather adaptation
  weatherAdaptation: boolean

  // Step 17: First time
  firstTime: boolean | null

  // Step 18: Must see/avoid
  mustSee: string
  mustAvoid: string
  alreadyBooked: string

  // Auto-detected from browser
  language?: string
}

export const defaultOnboardingData: OnboardingData = {
  destination: "",
  startDate: "",
  endDate: "",
  arrivalTime: null,
  departureTime: null,
  companion: null,
  groupSize: 2,
  kidsPets: [],
  mobility: null,
  hasMobilityNeeds: false,
  accommodationZone: "",
  interests: [],
  travelerStyle: null,
  famousLocal: 50,
  pace: 50,
  wantsRestDays: false,
  restDayFrequency: null,
  wakeTime: 30,
  wantsSiesta: false,
  budget: null,
  splurge: [],
  dietary: [],
  allergies: "",
  transport: [],
  weatherAdaptation: true,
  firstTime: null,
  mustSee: "",
  mustAvoid: "",
  alreadyBooked: "",
}

export type StepId =
  | "destination"
  | "companions"
  | "kids-pets"
  | "mobility"
  | "accommodation"
  | "interests"
  | "traveler-style"
  | "famous-local"
  | "pace"
  | "rest-days"
  | "day-style"
  | "budget"
  | "splurge"
  | "dietary"
  | "transport"
  | "weather"
  | "first-time"
  | "must-see"
  // Core 5-step flow
  | "core-destination"
  | "core-companions"
  | "core-finalize"
