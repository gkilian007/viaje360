import { createClient } from "@supabase/supabase-js"
import fs from "node:fs/promises"
import path from "node:path"

function parseEnvFile(content) {
  return Object.fromEntries(
    content
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=")
        const key = line.slice(0, idx).trim()
        const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "")
        return [key, value]
      })
  )
}

function normalizeText(value) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "seed"
}

function unique(values) {
  return [...new Set(values)]
}

function intersection(values, allowed) {
  const allowedSet = new Set(allowed)
  return unique(values.filter((value) => allowedSet.has(value)))
}

const VALID_INTERESTS = [
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
]

const VALID_TRANSPORT = ["pie", "publico", "taxi", "coche", "bici", "mix"]
const VALID_KIDS_PETS = ["bebe", "ninos", "pre-adolescentes", "perro-pequeno", "perro-grande", "otro-animal", "ninguno"]
const VALID_MOBILITY = ["full", "moderate", "frequent-rest", "wheelchair", "reduced"]
const VALID_TRAVELER_STYLE = ["instagrammer", "experiencial", "explorador", "cultural"]
const VALID_BUDGET = ["economico", "moderado", "premium"]
const VALID_COMPANION = ["solo", "pareja", "familia", "amigos"]

function buildSeedMarker(seedId) {
  return `seed:${seedId}`
}

function deriveCompanion(tags) {
  if (tags.includes("familia")) return "familia"
  if (tags.includes("pareja")) return "pareja"
  if (tags.includes("amigos")) return "amigos"
  if (tags.includes("solo")) return "solo"
  return "solo"
}

function deriveGroupSize(companion) {
  switch (companion) {
    case "pareja":
      return 2
    case "familia":
      return 4
    case "amigos":
      return 4
    default:
      return 1
  }
}

function deriveBudget(tags) {
  const match = tags.find((tag) => VALID_BUDGET.includes(tag))
  return match ?? "moderado"
}

function deriveMobility(tags) {
  if (tags.includes("wheelchair")) return "wheelchair"
  if (tags.includes("movilidad-reducida") || tags.includes("reduced") || tags.includes("accesible")) return "reduced"
  if (tags.includes("frequent-rest")) return "frequent-rest"
  if (tags.includes("moderate")) return "moderate"
  return "full"
}

function deriveTravelerStyle(tags) {
  if (tags.includes("explorador")) return "explorador"
  if (tags.includes("cultural") || tags.includes("clasico")) return "cultural"
  if (tags.includes("design") || tags.includes("premium")) return "instagrammer"
  if (tags.includes("aventura") || tags.includes("naturaleza") || tags.includes("urbano")) return "experiencial"
  return null
}

function deriveInterests(tags) {
  const mapped = []
  for (const tag of tags) {
    if (VALID_INTERESTS.includes(tag)) mapped.push(tag)
    else if (tag === "cultural" || tag === "clasico") mapped.push("historia", "arte")
    else if (tag === "mix" || tag === "highlights") mapped.push("historia")
    else if (tag === "design") mapped.push("arte")
    else if (tag === "urbano") mapped.push("fotografia")
    else if (tag === "accesible") mapped.push("historia")
    else if (tag === "primera-visita") mapped.push("historia")
  }
  return intersection(unique(mapped), VALID_INTERESTS)
}

function deriveTransport(tags, destination) {
  const mapped = []
  if (tags.includes("accesible") || tags.includes("movilidad-reducida")) mapped.push("publico", "taxi")
  if (["madrid", "barcelona", "paris", "roma", "lisboa", "nueva york", "new york", "tokyo"].includes(normalizeText(destination))) {
    mapped.push("publico", "pie")
  }
  return intersection(unique(mapped), VALID_TRANSPORT)
}

function deriveKidsPets(companion, tags) {
  if (companion === "familia") return ["ninos"]
  const explicit = intersection(tags, VALID_KIDS_PETS)
  return explicit
}

function deriveFirstTime(tags) {
  if (tags.includes("primera-visita") || tags.includes("highlights") || tags.includes("clasico")) return true
  return true
}

function deriveSeedTripName(destination, itinerary, tags) {
  if (itinerary?.tripName?.trim()) return itinerary.tripName.trim()
  return `Seed ${destination} — ${tags.join(" / ")}`
}

function addDays(isoDate, offsetDays) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function ensureItineraryDates(itinerary, fallbackStartDate) {
  const existingDates = itinerary.days.map((day) => day.date).filter(Boolean)
  const baseDate = existingDates[0] ?? fallbackStartDate
  if (!baseDate) {
    throw new Error("Itinerary has no valid base date")
  }

  return {
    ...itinerary,
    days: itinerary.days.map((day, index) => ({
      ...day,
      date: day.date || addDays(baseDate, index),
    })),
  }
}

function buildOnboardingPayload(entry, itinerary) {
  const tags = entry.targetProfiles.map((tag) => normalizeText(tag)).filter(Boolean)
  const companion = deriveCompanion(tags)
  const mobility = deriveMobility(tags)
  const travelerStyle = deriveTravelerStyle(tags)
  const budget = deriveBudget(tags)
  const interests = deriveInterests(tags)
  const transport = deriveTransport(tags, entry.destination)
  const kidsPets = deriveKidsPets(companion, tags)
  const normalizedItinerary = ensureItineraryDates(itinerary, entry.fallbackStartDate)
  const dates = normalizedItinerary.days.map((day) => day.date).filter(Boolean)
  const startDate = dates[0]
  const endDate = dates[dates.length - 1] ?? startDate

  if (!startDate || !endDate) {
    throw new Error(`Seed ${entry.seedId} has no valid day dates`)
  }

  return {
    destination: entry.destination,
    start_date: startDate,
    end_date: endDate,
    arrival_time: null,
    departure_time: null,
    companion: VALID_COMPANION.includes(companion) ? companion : "solo",
    group_size: deriveGroupSize(companion),
    kids_pets: kidsPets,
    mobility: VALID_MOBILITY.includes(mobility) ? mobility : "full",
    accommodation_zone: null,
    interests,
    traveler_style: travelerStyle && VALID_TRAVELER_STYLE.includes(travelerStyle) ? travelerStyle : null,
    famous_local: "mix",
    pace: 5,
    rest_days: false,
    rest_frequency: null,
    wake_style: 30,
    siesta: false,
    budget_level: VALID_BUDGET.includes(budget) ? budget : "moderado",
    splurge_categories: [],
    dietary_restrictions: [],
    allergies: null,
    transport,
    weather_adaptation: true,
    first_time: deriveFirstTime(tags),
    must_see: null,
    must_avoid: null,
    booked_tickets: null,
  }
}

function calculateItineraryBudget(itinerary) {
  return itinerary.days.reduce((dayTotal, day) => {
    return dayTotal + day.activities.reduce((actTotal, act) => actTotal + Number(act.cost ?? 0), 0)
  }, 0)
}

async function insertItinerarySchedule(supabase, tripId, itinerary) {
  for (const day of itinerary.days) {
    const { data: dayRow, error: dayError } = await supabase
      .from("itinerary_days")
      .insert({
        trip_id: tripId,
        day_number: day.dayNumber,
        date: day.date,
        theme: day.theme,
        is_rest_day: day.isRestDay,
      })
      .select()
      .single()

    if (dayError || !dayRow) {
      throw dayError ?? new Error(`Failed to insert itinerary day ${day.dayNumber}`)
    }

    if (!day.activities?.length) continue

    const { error: activitiesError } = await supabase.from("activities").insert(
      day.activities.map((act, index) => ({
        day_id: dayRow.id,
        trip_id: tripId,
        name: act.name,
        type: act.type,
        location: act.location ?? null,
        address: act.address ?? null,
        latitude: act.lat ?? null,
        longitude: act.lng ?? null,
        time: act.time ?? null,
        end_time: act.endTime ?? null,
        duration: act.duration ?? null,
        cost: Number(act.cost ?? 0),
        booked: false,
        is_locked: act.isLocked ?? false,
        notes: act.notes ?? null,
        icon: act.icon ?? null,
        neighborhood: act.location ?? null,
        is_ai_suggestion: true,
        weather_dependent: act.weatherDependent ?? false,
        indoor: act.indoor ?? false,
        accessibility_info: null,
        kid_friendly: act.kidFriendly ?? false,
        pet_friendly: act.petFriendly ?? false,
        dietary_tags: act.dietaryTags ?? [],
        sort_order: index,
        description: act.description ?? null,
        url: act.url ?? null,
        image_query: act.imageQuery ?? null,
        price_per_person: act.pricePerPerson ?? null,
        recommendation_reason: act.recommendationReason ?? null,
      }))
    )

    if (activitiesError) throw activitiesError
  }
}

async function loadRuntime() {
  const cwd = process.cwd()
  const envFile = await fs.readFile(path.join(cwd, ".env.local"), "utf8")
  const env = parseEnvFile(envFile)

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  }

  const curatedSeeds = JSON.parse(await fs.readFile(path.join(cwd, "knowledge", "seed-itineraries", "curated-seeds.json"), "utf8"))
  const library = JSON.parse(await fs.readFile(path.join(cwd, "knowledge", "seed-itineraries", "library.json"), "utf8"))
  const libraryMap = new Map(library.map((item) => [item.id, item]))
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  return { curatedSeeds, libraryMap, supabase }
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  const write = args.has("--write")
  const allSeedIds = args.has("--all-seed-ids")
  const destinationArg = argv.find((arg) => arg.startsWith("--destinations="))
  const destinations = destinationArg
    ? destinationArg
        .split("=", 2)[1]
        .split(",")
        .map((value) => normalizeText(value))
        .filter(Boolean)
    : []

  return { write, allSeedIds, destinations }
}

function materializeSeedPlan(curatedSeeds, libraryMap, options) {
  const plan = []

  for (const entry of curatedSeeds) {
    if (options.destinations.length > 0 && !options.destinations.includes(normalizeText(entry.destination))) {
      continue
    }

    const seedIds = options.allSeedIds ? entry.seedIds : entry.seedIds.slice(0, 1)
    for (const seedId of seedIds) {
      const source = libraryMap.get(seedId)
      if (!source?.snapshot?.days?.length) {
        throw new Error(`Missing library snapshot for seed ${seedId}`)
      }

      const fallbackStartDate = source.snapshot?.days?.map((day) => day?.date).filter(Boolean)[0] ?? (String(source.createdAt ?? "").slice(0, 10) || null)
      plan.push({
        destination: entry.destination,
        targetProfiles: entry.targetProfiles,
        notes: entry.notes,
        seedId,
        sourceTripId: source.tripId,
        sourceVersionId: source.versionId,
        sourceCreatedAt: source.createdAt,
        fallbackStartDate,
        itinerary: structuredClone(source.snapshot),
      })
    }
  }

  return plan
}

async function fetchExistingMarkers(supabase, markers) {
  if (markers.length === 0) return new Set()

  const { data, error } = await supabase
    .from("trips")
    .select("id,current_activity")
    .in("current_activity", markers)

  if (error) throw error
  return new Set((data ?? []).map((row) => row.current_activity).filter(Boolean))
}

async function seedOneEntry(supabase, entry) {
  const marker = buildSeedMarker(entry.seedId)
  const itinerary = ensureItineraryDates(entry.itinerary, entry.fallbackStartDate)
  const onboarding = buildOnboardingPayload(entry, itinerary)
  const budget = calculateItineraryBudget(itinerary)
  const reason = `Seeded curated itinerary from ${entry.seedId}`

  const { data: onboardingRow, error: onboardingError } = await supabase
    .from("onboarding_profiles")
    .insert(onboarding)
    .select("id")
    .single()

  if (onboardingError || !onboardingRow) {
    throw onboardingError ?? new Error(`Failed to create onboarding for ${entry.seedId}`)
  }

  const tripPayload = {
    user_id: null,
    onboarding_id: onboardingRow.id,
    name: deriveSeedTripName(entry.destination, entry.itinerary, entry.targetProfiles),
    destination: entry.destination,
    start_date: onboarding.start_date,
    end_date: onboarding.end_date,
    budget,
    spent: 0,
    status: "completed",
    current_activity: marker,
  }

  const { data: tripRow, error: tripError } = await supabase
    .from("trips")
    .insert(tripPayload)
    .select("id")
    .single()

  if (tripError || !tripRow) {
    await supabase.from("onboarding_profiles").delete().eq("id", onboardingRow.id)
    throw tripError ?? new Error(`Failed to create trip for ${entry.seedId}`)
  }

  try {
    await insertItinerarySchedule(supabase, tripRow.id, itinerary)

    const { error: versionError } = await supabase.from("itinerary_versions").insert({
      trip_id: tripRow.id,
      version_number: 1,
      snapshot: structuredClone(itinerary),
      source: "system",
      reason,
      created_by: null,
    })

    if (versionError) throw versionError

    return {
      tripId: tripRow.id,
      onboardingId: onboardingRow.id,
      marker,
      budget,
    }
  } catch (error) {
    await supabase.from("trips").delete().eq("id", tripRow.id)
    await supabase.from("onboarding_profiles").delete().eq("id", onboardingRow.id)
    throw error
  }
}

async function main() {
  const options = parseArgs(process.argv)
  const { curatedSeeds, libraryMap, supabase } = await loadRuntime()
  const plan = materializeSeedPlan(curatedSeeds, libraryMap, options)
  const markers = plan.map((entry) => buildSeedMarker(entry.seedId))
  const existingMarkers = await fetchExistingMarkers(supabase, markers)

  const pending = plan.filter((entry) => !existingMarkers.has(buildSeedMarker(entry.seedId)))

  console.log(`Curated entries considered: ${plan.length}`)
  console.log(`Already seeded: ${plan.length - pending.length}`)
  console.log(`Pending seed inserts: ${pending.length}`)
  console.log(`Mode: ${options.write ? "WRITE" : "DRY-RUN"}`)

  for (const entry of pending) {
    console.log(`- ${entry.destination} | ${entry.seedId} | ${entry.targetProfiles.join(", ")}`)
  }

  if (!options.write) {
    console.log("\nDry run only. Re-run with --write to insert rows into Supabase.")
    return
  }

  const inserted = []
  for (const entry of pending) {
    const result = await seedOneEntry(supabase, entry)
    inserted.push({ ...result, seedId: entry.seedId, destination: entry.destination })
    console.log(`Inserted ${entry.seedId} -> trip ${result.tripId}`)
  }

  console.log(`\nInserted ${inserted.length} curated itinerary seeds.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
