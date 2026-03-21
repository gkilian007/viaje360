export const APP_NAME = "Viaje360"

export const LEVELS = [
  { level: 1, name: "Turista Novato", xpRequired: 0 },
  { level: 2, name: "Explorador", xpRequired: 500 },
  { level: 3, name: "Aventurero", xpRequired: 1200 },
  { level: 5, name: "Viajero", xpRequired: 2000 },
  { level: 8, name: "Globetrotter", xpRequired: 3500 },
  { level: 12, name: "Maestro Viajero", xpRequired: 6000 },
  { level: 15, name: "Embajador del Mundo", xpRequired: 10000 },
]

export const XP_REWARDS = {
  MONUMENT_COLLECTED: 150,
  TRIP_COMPLETED: 500,
  QUIZ_CORRECT: 50,
  RESTAURANT_VISITED: 75,
  ACTIVITY_COMPLETED: 100,
  PHOTO_SHARED: 25,
}

export const MONUMENT_RARITIES = {
  common: { color: "#6b7280", label: "Común" },
  rare: { color: "#3b82f6", label: "Raro" },
  epic: { color: "#8b5cf6", label: "Épico" },
  legendary: { color: "#f59e0b", label: "Legendario" },
}

export const TAB_ROUTES = {
  HOME: "/",
  EXPLORE: "/explore",
  TRIP: "/trip",
  COLLECTION: "/collection",
  PROFILE: "/profile",
}
