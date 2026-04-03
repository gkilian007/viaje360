#!/usr/bin/env node
/**
 * Add Tier 2 cities to destinations-photos.json
 * Fetches hero + POI photos from Wikipedia API (free, no key needed)
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, "../data/photos/metadata/destinations-photos.json")

const TIER2_CITIES = [
  // Europe
  { city: "Florencia", country: "Italia", wiki: "Florence", pois: ["Florence Cathedral", "Uffizi", "Ponte Vecchio", "Palazzo Vecchio", "Piazzale Michelangelo", "Basilica of Santa Croce, Florence", "Boboli Gardens", "Galleria dell'Accademia"] },
  { city: "Venecia", country: "Italia", wiki: "Venice", pois: ["St Mark's Basilica", "Rialto Bridge", "Doge's Palace", "Grand Canal", "Bridge of Sighs", "Piazza San Marco", "Murano", "Burano"] },
  { city: "Milán", country: "Italia", wiki: "Milan", pois: ["Milan Cathedral", "Galleria Vittorio Emanuele II", "Sforza Castle", "Santa Maria delle Grazie", "Navigli", "Pinacoteca di Brera", "Teatro alla Scala"] },
  { city: "Múnich", country: "Alemania", wiki: "Munich", pois: ["Marienplatz", "Nymphenburg Palace", "Englischer Garten", "Frauenkirche, Munich", "BMW Welt", "Viktualienmarkt", "Residenz, Munich"] },
  { city: "Copenhague", country: "Dinamarca", wiki: "Copenhagen", pois: ["Tivoli Gardens", "The Little Mermaid (statue)", "Nyhavn", "Amalienborg", "Christiansborg Palace", "Rosenborg Castle", "Strøget"] },
  { city: "Atenas", country: "Grecia", wiki: "Athens", pois: ["Acropolis of Athens", "Parthenon", "Temple of Olympian Zeus, Athens", "Ancient Agora of Athens", "Plaka", "Monastiraki", "Panathenaic Stadium"] },
  { city: "Edimburgo", country: "Reino Unido", wiki: "Edinburgh", pois: ["Edinburgh Castle", "Royal Mile", "Arthur's Seat", "Holyrood Palace", "Scott Monument", "Calton Hill", "National Museum of Scotland"] },
  { city: "Dubrovnik", country: "Croacia", wiki: "Dubrovnik", pois: ["Walls of Dubrovnik", "Dubrovnik Cathedral", "Rector's Palace, Dubrovnik", "Stradun (street)", "Lokrum", "Fort Lovrijenac"] },
  { city: "Budapest", country: "Hungría", wiki: "Budapest", pois: ["Hungarian Parliament Building", "Buda Castle", "Széchenyi thermal bath", "Fisherman's Bastion", "Chain Bridge (Budapest)", "St. Stephen's Basilica", "Heroes' Square (Budapest)"] },
  { city: "Cracovia", country: "Polonia", wiki: "Kraków", pois: ["Wawel Castle", "Main Market Square, Kraków", "St. Mary's Basilica, Kraków", "Auschwitz concentration camp", "Kazimierz", "Wieliczka Salt Mine"] },
  { city: "Bruselas", country: "Bélgica", wiki: "Brussels", pois: ["Grand-Place", "Manneken Pis", "Atomium", "Royal Palace of Brussels", "Mini-Europe", "Cathedral of St. Michael and St. Gudula"] },
  { city: "Zúrich", country: "Suiza", wiki: "Zurich", pois: ["Lake Zurich", "Grossmünster", "Bahnhofstrasse", "Swiss National Museum", "Lindenhof hill", "Old Town (Zurich)"] },
  { city: "Santorini", country: "Grecia", wiki: "Santorini", pois: ["Oia, Greece", "Fira", "Akrotiri (prehistoric city)", "Red Beach (Santorini)", "Perissa"] },
  { city: "Brujas", country: "Bélgica", wiki: "Bruges", pois: ["Belfry of Bruges", "Market Square (Bruges)", "Basilica of the Holy Blood", "Groeningemuseum", "Minnewater", "Church of Our Lady, Bruges"] },
  // Americas
  { city: "Río de Janeiro", country: "Brasil", wiki: "Rio de Janeiro", pois: ["Christ the Redeemer", "Sugarloaf Mountain", "Copacabana", "Ipanema", "Maracanã Stadium", "Tijuca National Park", "Selarón Steps"] },
  { city: "Cusco", country: "Perú", wiki: "Cusco", pois: ["Sacsayhuamán", "Plaza de Armas, Cusco", "Qorikancha", "San Pedro Market, Cusco", "Machu Picchu"] },
  { city: "Cartagena", country: "Colombia", wiki: "Cartagena, Colombia", pois: ["Walled City of Cartagena", "Castillo San Felipe de Barajas", "Bocagrande", "Rosario Islands", "Clock Tower (Cartagena)"] },
  { city: "La Habana", country: "Cuba", wiki: "Havana", pois: ["Old Havana", "Malecón, Havana", "Capitolio", "Plaza de la Revolución", "Morro Castle (Havana)", "Cathedral of Havana"] },
  { city: "San Francisco", country: "EE.UU.", wiki: "San Francisco", pois: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf, San Francisco", "Chinatown, San Francisco", "Lombard Street", "Palace of Fine Arts"] },
  { city: "Vancouver", country: "Canadá", wiki: "Vancouver", pois: ["Stanley Park", "Granville Island", "Capilano Suspension Bridge", "Gastown", "Science World at Telus World of Science", "English Bay"] },
  // Asia
  { city: "Osaka", country: "Japón", wiki: "Osaka", pois: ["Osaka Castle", "Dōtonbori", "Shitennō-ji", "Tsūtenkaku", "Osaka Aquarium Kaiyukan", "Shinsekai"] },
  { city: "Hanói", country: "Vietnam", wiki: "Hanoi", pois: ["Hoàn Kiếm Lake", "Temple of Literature, Hanoi", "Ho Chi Minh Mausoleum", "Old Quarter, Hanoi", "One Pillar Pagoda", "Long Biên Bridge"] },
  { city: "Bali", country: "Indonesia", wiki: "Bali", pois: ["Tanah Lot", "Uluwatu Temple", "Tegallalang Rice Terrace", "Ubud", "Tirta Empul", "Besakih Temple"] },
  { city: "Seúl", country: "Corea del Sur", wiki: "Seoul", pois: ["Gyeongbokgung", "N Seoul Tower", "Bukchon Hanok Village", "Myeongdong", "Changdeokgung", "Dongdaemun Design Plaza"] },
  { city: "Kioto", country: "Japón", wiki: "Kyoto", pois: ["Fushimi Inari-taisha", "Kinkaku-ji", "Arashiyama", "Kiyomizu-dera", "Nijō Castle", "Gion", "Philosopher's Walk"] },
  // Africa & Middle East
  { city: "Ciudad del Cabo", country: "Sudáfrica", wiki: "Cape Town", pois: ["Table Mountain", "Cape of Good Hope", "V&A Waterfront", "Robben Island", "Kirstenbosch National Botanical Garden", "Bo-Kaap"] },
  { city: "El Cairo", country: "Egipto", wiki: "Cairo", pois: ["Giza pyramid complex", "Egyptian Museum", "Khan el-Khalili", "Cairo Citadel", "Al-Azhar Mosque", "Mosque of Muhammad Ali"] },
  { city: "Petra", country: "Jordania", wiki: "Petra", pois: ["Al-Khazneh", "The Siq", "Ad Deir", "Petra theatre", "High Place of Sacrifice"] },
  // Oceania
  { city: "Sídney", country: "Australia", wiki: "Sydney", pois: ["Sydney Opera House", "Sydney Harbour Bridge", "Bondi Beach", "The Rocks, Sydney", "Royal Botanic Garden, Sydney", "Taronga Zoo"] },
  { city: "Queenstown", country: "Nueva Zelanda", wiki: "Queenstown, New Zealand", pois: ["Lake Wakatipu", "Milford Sound", "Skyline Queenstown", "Queenstown Gardens", "Remarkables"] },
]

async function getWikiImage(article) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Viaje360/1.0 (kilian@viaje360.app)" } })
    if (!res.ok) return null
    const data = await res.json()
    if (data.originalimage) {
      return {
        url: data.originalimage.source,
        width: data.originalimage.width,
        height: data.originalimage.height,
        source: "wikipedia",
        articleTitle: article,
        method: "wikipedia_main",
      }
    }
    if (data.thumbnail) {
      return {
        url: data.thumbnail.source.replace(/\/\d+px-/, "/800px-"),
        width: data.thumbnail.width,
        height: data.thumbnail.height,
        source: "wikipedia",
        articleTitle: article,
        method: "wikipedia_thumb",
      }
    }
    return null
  } catch {
    return null
  }
}

async function processCity(city) {
  console.log(`  ${city.city}...`)
  const hero = await getWikiImage(city.wiki)
  if (!hero) {
    console.log(`    ⚠️ No hero image for ${city.city}`)
    return null
  }

  const pois = []
  for (const poi of city.pois) {
    const photo = await getWikiImage(poi)
    if (photo) {
      pois.push({ name: poi, photo })
    } else {
      console.log(`    ⚠️ No photo for POI: ${poi}`)
    }
    // Be nice to Wikipedia API
    await new Promise((r) => setTimeout(r, 100))
  }

  return {
    city: city.city,
    country: city.country,
    wiki: city.wiki,
    hero,
    pois,
  }
}

async function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
  const existingCities = new Set(db.map((d) => d.city.toLowerCase()))

  console.log(`Existing: ${db.length} cities`)
  console.log(`Adding Tier 2: ${TIER2_CITIES.length} cities\n`)

  let added = 0
  for (const city of TIER2_CITIES) {
    if (existingCities.has(city.city.toLowerCase())) {
      console.log(`  ⏭️ ${city.city} already exists`)
      continue
    }

    const entry = await processCity(city)
    if (entry) {
      db.push(entry)
      added++
      console.log(`    ✅ ${city.city}: hero + ${entry.pois.length} POIs`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  console.log(`\nDone: added ${added} cities. Total: ${db.length}`)
}

main().catch(console.error)
