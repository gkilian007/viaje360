"use client"

import { create } from "zustand"
import type { Trip, Monument, Trophy, User } from "@/lib/types"
import { demoUser, demoTrip, demoMonuments, demoTrophies } from "@/lib/demo-data"

interface AppState {
  user: User
  currentTrip: Trip | null
  monuments: Monument[]
  trophies: Trophy[]
  activeTab: string

  // Actions
  setCurrentTrip: (trip: Trip | null) => void
  addMonument: (monument: Monument) => void
  collectMonument: (monumentId: string) => void
  addXp: (amount: number) => void
  setActiveTab: (tab: string) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: demoUser,
  currentTrip: demoTrip,
  monuments: demoMonuments,
  trophies: demoTrophies,
  activeTab: "/",

  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  addMonument: (monument) =>
    set((state) => ({
      monuments: [...state.monuments, monument],
      user: {
        ...state.user,
        monumentsCollected: state.user.monumentsCollected + 1,
      },
    })),

  collectMonument: (monumentId) =>
    set((state) => {
      const monument = state.monuments.find((m) => m.id === monumentId)
      if (!monument || monument.collected) return state

      return {
        monuments: state.monuments.map((m) =>
          m.id === monumentId
            ? { ...m, collected: true, collectedAt: new Date().toISOString() }
            : m
        ),
        user: {
          ...state.user,
          xp: state.user.xp + monument.xpReward,
          monumentsCollected: state.user.monumentsCollected + 1,
        },
      }
    }),

  addXp: (amount) =>
    set((state) => {
      const newXp = state.user.xp + amount
      const newLevel = Math.floor(newXp / 500) + 1
      return {
        user: {
          ...state.user,
          xp: newXp,
          level: Math.max(state.user.level, Math.min(newLevel, 20)),
        },
      }
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateUser: (updates) =>
    set((state) => ({
      user: { ...state.user, ...updates },
    })),
}))
