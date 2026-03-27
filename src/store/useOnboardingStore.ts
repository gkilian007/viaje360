"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { OnboardingData, StepId } from "@/lib/onboarding-types"
import { defaultOnboardingData } from "@/lib/onboarding-types"

// Core 5 steps (always shown)
const CORE_STEPS: StepId[] = [
  "core-destination",   // Step 1: destination + dates + groupSize
  "core-companions",    // Step 2: companion + kids-pets inline if familia
  "interests",          // Step 3: interests (chips)
  "budget",             // Step 4: budget
  "core-finalize",      // Step 5: mustSee + firstTime + advanced accordion
]

// Advanced steps (optional, shown only if user expands accordion in step 5)
const ADVANCED_STEPS: StepId[] = [
  "accommodation",
  "traveler-style",
  "famous-local",
  "pace",
  "rest-days",
  "day-style",
  "splurge",
  "dietary",
  "transport",
  "weather",
  "mobility",
]

// Legacy full steps (kept for reference / fallback)
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
  // Whether the user expanded the advanced accordion in step 5
  advancedExpanded: boolean
  // Current position within advanced steps (null = not in advanced)
  advancedStepIndex: number | null

  getVisibleSteps: () => StepId[]
  getCurrentStepIndex: () => number
  getTotalSteps: () => number
  getProgress: () => number
  isStepValid: () => boolean
  isInAdvanced: () => boolean

  nextStep: () => void
  prevStep: () => void
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  setAdvancedExpanded: (v: boolean) => void
  completeOnboarding: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      data: defaultOnboardingData,
      currentStepId: "core-destination",
      onboardingComplete: false,
      direction: 1,
      advancedExpanded: false,
      advancedStepIndex: null,

      getVisibleSteps: () => {
        const { advancedExpanded } = get()
        // Core flow always visible; advanced only if expanded
        if (!advancedExpanded) return CORE_STEPS
        return [...CORE_STEPS, ...ADVANCED_STEPS]
      },

      getCurrentStepIndex: () => {
        const { currentStepId, getVisibleSteps } = get()
        const steps = getVisibleSteps()
        const idx = steps.indexOf(currentStepId)
        return idx >= 0 ? idx : 0
      },

      getTotalSteps: () => CORE_STEPS.length, // progress bar always based on 5 core steps

      getProgress: () => {
        const { currentStepId } = get()
        const idx = CORE_STEPS.indexOf(currentStepId)
        if (idx >= 0) return (idx + 1) / CORE_STEPS.length
        // In advanced steps: keep at 100%
        return 1
      },

      isInAdvanced: () => {
        const { currentStepId } = get()
        return ADVANCED_STEPS.includes(currentStepId)
      },

      isStepValid: () => {
        const { data, currentStepId } = get()
        switch (currentStepId) {
          // Core steps
          case "core-destination":
            return data.destination.trim().length > 0 && data.startDate.length > 0 && data.endDate.length > 0
          case "core-companions":
            return data.companion !== null
          case "core-finalize":
            return true
          // Reused steps
          case "interests":
            return data.interests.length > 0
          case "budget":
            return data.budget !== null
          // Legacy steps (advanced)
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
        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
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

      setAdvancedExpanded: (v: boolean) => set({ advancedExpanded: v }),

      completeOnboarding: () => set({ onboardingComplete: true }),

      reset: () =>
        set({
          data: defaultOnboardingData,
          currentStepId: "core-destination",
          onboardingComplete: false,
          direction: 1,
          advancedExpanded: false,
          advancedStepIndex: null,
        }),
    }),
    {
      name: "viaje360-onboarding",
      partialize: (state) => ({
        data: state.data,
        currentStepId: state.currentStepId,
        onboardingComplete: state.onboardingComplete,
        advancedExpanded: state.advancedExpanded,
      }),
    }
  )
)
