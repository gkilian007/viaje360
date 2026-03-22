"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { OnboardingData, StepId } from "@/lib/onboarding-types"
import { defaultOnboardingData } from "@/lib/onboarding-types"

const ALL_STEPS: StepId[] = [
  "destination",
  "companions",
  "kids-pets",
  "mobility",
  "accommodation",
  "interests",
  "traveler-style",
  "famous-local",
  "pace",
  "rest-days",
  "day-style",
  "budget",
  "splurge",
  "dietary",
  "transport",
  "weather",
  "first-time",
  "must-see",
]

interface OnboardingState {
  data: OnboardingData
  currentStepId: StepId
  onboardingComplete: boolean
  direction: 1 | -1

  getVisibleSteps: () => StepId[]
  getCurrentStepIndex: () => number
  getTotalSteps: () => number
  getProgress: () => number
  isStepValid: () => boolean

  nextStep: () => void
  prevStep: () => void
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  completeOnboarding: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      data: defaultOnboardingData,
      currentStepId: "destination",
      onboardingComplete: false,
      direction: 1,

      getVisibleSteps: () => {
        const { data } = get()
        return ALL_STEPS.filter((step) => {
          if (step === "kids-pets") return data.companion === "familia"
          if (step === "mobility")
            return data.companion === "familia" || data.hasMobilityNeeds
          return true
        })
      },

      getCurrentStepIndex: () => {
        const { currentStepId, getVisibleSteps } = get()
        return getVisibleSteps().indexOf(currentStepId)
      },

      getTotalSteps: () => get().getVisibleSteps().length,

      getProgress: () => {
        const { getCurrentStepIndex, getTotalSteps } = get()
        const total = getTotalSteps()
        if (total === 0) return 0
        return (getCurrentStepIndex() + 1) / total
      },

      isStepValid: () => {
        const { data, currentStepId } = get()
        switch (currentStepId) {
          case "destination":
            return data.destination.trim().length > 0
          case "companions":
            return data.companion !== null
          case "kids-pets":
            return data.kidsPets.length > 0
          case "mobility":
            return data.mobility !== null
          case "accommodation":
            return true
          case "interests":
            return data.interests.length > 0
          case "traveler-style":
            return data.travelerStyle !== null
          case "famous-local":
            return true
          case "pace":
            return true
          case "rest-days":
            return true
          case "day-style":
            return true
          case "budget":
            return data.budget !== null
          case "splurge":
            return data.splurge.length > 0
          case "dietary":
            return data.dietary.length > 0
          case "transport":
            return data.transport.length > 0
          case "weather":
            return true
          case "first-time":
            return data.firstTime !== null
          case "must-see":
            return true
          default:
            return true
        }
      },

      nextStep: () => {
        const { currentStepId, getVisibleSteps } = get()
        const steps = getVisibleSteps()
        const currentIndex = steps.indexOf(currentStepId)
        if (currentIndex < steps.length - 1) {
          set({ currentStepId: steps[currentIndex + 1], direction: 1 })
        }
      },

      prevStep: () => {
        const { currentStepId, getVisibleSteps } = get()
        const steps = getVisibleSteps()
        const currentIndex = steps.indexOf(currentStepId)
        if (currentIndex > 0) {
          set({ currentStepId: steps[currentIndex - 1], direction: -1 })
        }
      },

      setField: (key, value) =>
        set((state) => ({ data: { ...state.data, [key]: value } })),

      completeOnboarding: () => set({ onboardingComplete: true }),

      reset: () =>
        set({
          data: defaultOnboardingData,
          currentStepId: "destination",
          onboardingComplete: false,
          direction: 1,
        }),
    }),
    {
      name: "viaje360-onboarding",
      partialize: (state) => ({
        data: state.data,
        currentStepId: state.currentStepId,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
)
