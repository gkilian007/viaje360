"use client"

import { useState } from "react"
import { Search, Landmark, Trees, ShoppingBag, Star, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DestinationCard } from "@/components/features/DestinationCard"
import { ActivityCard } from "@/components/features/ActivityCard"
import { QuizCard } from "@/components/features/QuizCard"

const destinations = [
  {
    id: "dest-1",
    name: "Madrid",
    country: "España 🇪🇸",
    emoji: "🏛️",
    description: "Capital vibrante llena de arte, cultura y gastronomía.",
    gradient: "from-red-500 to-orange-600",
    isActive: true,
  },
  {
    id: "dest-2",
    name: "Barcelona",
    country: "España 🇪🇸",
    emoji: "🏖️",
    description: "Ciudad modernista junto al Mediterráneo.",
    gradient: "from-blue-500 to-cyan-600",
    isActive: false,
  },
  {
    id: "dest-3",
    name: "París",
    country: "Francia 🇫🇷",
    emoji: "🗼",
    description: "La ciudad del amor, la moda y la gastronomía.",
    gradient: "from-purple-500 to-pink-600",
    isActive: false,
  },
  {
    id: "dest-4",
    name: "Roma",
    country: "Italia 🇮🇹",
    emoji: "🏺",
    description: "La ciudad eterna, cuna de la civilización.",
    gradient: "from-yellow-500 to-orange-600",
    isActive: false,
  },
]

const activities = [
  {
    id: "act-1",
    name: "Museo del Prado",
    category: "Arte",
    price: "€15",
    rating: 4.8,
    icon: Landmark,
    duration: "3h",
  },
  {
    id: "act-2",
    name: "Parque del Retiro",
    category: "Naturaleza",
    price: "Gratis",
    rating: 4.9,
    icon: Trees,
    duration: "2h",
  },
  {
    id: "act-3",
    name: "Mercado de San Miguel",
    category: "Gastronomía",
    price: "€20 avg",
    rating: 4.6,
    icon: ShoppingBag,
    duration: "1.5h",
  },
  {
    id: "act-4",
    name: "Palacio Real",
    category: "Historia",
    price: "€12",
    rating: 4.7,
    icon: Landmark,
    duration: "2h",
  },
]

const restaurants = [
  {
    id: "rest-1",
    name: "Casa Botín",
    cuisine: "Tradicional español",
    priceRange: "€€€",
    rating: 4.9,
  },
  {
    id: "rest-2",
    name: "Mercado de la Reina",
    cuisine: "Tapas",
    priceRange: "€€",
    rating: 4.5,
  },
  {
    id: "rest-3",
    name: "La Favorita",
    cuisine: "Italiano",
    priceRange: "€€",
    rating: 4.3,
  },
]

const quizData = {
  question: "¿En qué año se fundó el Museo del Prado?",
  options: ["1789", "1819", "1850", "1902"],
  correctIndex: 1,
}

export default function ExplorePage() {
  const [search, setSearch] = useState("")

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 p-4 pb-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-white text-2xl font-bold mb-1">Explorar</h1>
        <p className="text-slate-400 text-sm">Descubre tu próximo destino</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Buscar destinos, actividades..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Featured Destinations */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">Destinos Destacados</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredDestinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              name={dest.name}
              country={dest.country}
              emoji={dest.emoji}
              description={dest.description}
              gradient={dest.gradient}
              isActive={dest.isActive}
            />
          ))}
        </div>
      </section>

      {/* Popular Activities */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">Actividades Populares en Madrid</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              name={activity.name}
              category={activity.category}
              price={activity.price}
              rating={activity.rating}
              icon={activity.icon}
              duration={activity.duration}
            />
          ))}
        </div>
      </section>

      {/* Recommended Restaurants */}
      <section>
        <h2 className="text-white font-semibold text-base mb-3">Restaurantes Recomendados</h2>
        <div className="space-y-2">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="border-slate-700/30 cursor-pointer hover:border-slate-600/50 transition-colors">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{restaurant.name}</p>
                  <p className="text-slate-400 text-xs">{restaurant.cuisine}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 text-xs font-medium">{restaurant.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{restaurant.priceRange}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quiz del Día */}
      <section>
        <QuizCard quizData={quizData} />
      </section>
    </div>
  )
}
