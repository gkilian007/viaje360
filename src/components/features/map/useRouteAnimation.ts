import { useRef, useState, useCallback, useEffect } from "react"
import type {
  ActivityWithCoords,
  AnimationState,
  AnimationConfig,
  RouteSegment,
  AvatarPosition,
} from "./types"
import {
  DEFAULT_ANIMATION_CONFIG,
  buildRouteSegments,
  interpolatePosition,
} from "./types"

interface UseRouteAnimationOptions {
  activities: ActivityWithCoords[]
  config?: Partial<AnimationConfig>
  onPositionChange?: (position: AvatarPosition) => void
  onActivityReached?: (activityIndex: number) => void
  onAnimationComplete?: () => void
}

interface UseRouteAnimationReturn {
  state: AnimationState
  position: AvatarPosition | null
  currentActivityIndex: number
  progress: number
  play: () => void
  pause: () => void
  reset: () => void
  jumpToActivity: (index: number) => void
}

export function useRouteAnimation({
  activities,
  config: configOverrides,
  onPositionChange,
  onActivityReached,
  onAnimationComplete,
}: UseRouteAnimationOptions): UseRouteAnimationReturn {
  const config: AnimationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...configOverrides }
  
  const [state, setState] = useState<AnimationState>("idle")
  const [position, setPosition] = useState<AvatarPosition | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const animationFrameRef = useRef<number | null>(null)
  const segmentsRef = useRef<RouteSegment[]>([])
  const currentSegmentIndexRef = useRef(0)
  const segmentProgressRef = useRef(0)
  const isPausedAtStopRef = useRef(false)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTimeRef = useRef<number>(0)
  const stateRef = useRef<AnimationState>("idle")
  
  // Sync state ref
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const calculateAvatarPosition = useCallback((): AvatarPosition | null => {
    if (activities.length === 0) return null
    
    const segments = segmentsRef.current
    const segmentIndex = currentSegmentIndexRef.current
    const segmentProgress = segmentProgressRef.current
    
    // At start or single activity
    if (segments.length === 0 || segmentIndex >= segments.length) {
      const actIndex = Math.min(segmentIndex, activities.length - 1)
      const coord = activities[actIndex].coordinates
      return {
        coordinate: coord,
        bearing: 0,
        progress: segmentIndex >= segments.length ? 1 : 0,
        currentSegmentIndex: Math.min(segmentIndex, segments.length - 1),
        isAtStop: true,
        currentActivityIndex: actIndex,
      }
    }
    
    const segment = segments[segmentIndex]
    const coordinate = interpolatePosition(segment, segmentProgress, config.easing)
    
    // Calculate total progress
    let totalDistance = 0
    let coveredDistance = 0
    
    segments.forEach((seg, i) => {
      totalDistance += seg.distance
      if (i < segmentIndex) {
        coveredDistance += seg.distance
      } else if (i === segmentIndex) {
        coveredDistance += seg.distance * segmentProgress
      }
    })
    
    const totalProgress = totalDistance > 0 ? coveredDistance / totalDistance : 0
    
    return {
      coordinate,
      bearing: segment.bearing,
      progress: totalProgress,
      currentSegmentIndex: segmentIndex,
      isAtStop: segmentProgress === 0 || segmentProgress === 1,
      currentActivityIndex: segmentProgress > 0.5 ? segment.activityIndex + 1 : segment.activityIndex,
    }
  }, [activities, config.easing])

  const animate = useCallback((timestamp: number) => {
    if (stateRef.current !== "playing" || isPausedAtStopRef.current) {
      return
    }
    
    const segments = segmentsRef.current
    if (segments.length === 0) {
      setState("finished")
      onAnimationComplete?.()
      return
    }
    
    // Calculate delta time
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1
    lastTimeRef.current = timestamp
    
    const currentSegment = segments[currentSegmentIndexRef.current]
    if (!currentSegment) {
      setState("finished")
      onAnimationComplete?.()
      return
    }
    
    // Advance progress
    const progressIncrement = (config.speed / currentSegment.distance) * deltaTime
    segmentProgressRef.current = Math.min(1, segmentProgressRef.current + progressIncrement)
    
    // Calculate and update position
    const newPosition = calculateAvatarPosition()
    if (newPosition) {
      setPosition(newPosition)
      setProgress(newPosition.progress)
      onPositionChange?.(newPosition)
    }
    
    // Check if segment complete
    if (segmentProgressRef.current >= 1) {
      const nextActivityIndex = currentSegmentIndexRef.current + 1
      
      // Pause at stop
      isPausedAtStopRef.current = true
      setCurrentActivityIndex(nextActivityIndex)
      onActivityReached?.(nextActivityIndex)
      
      pauseTimeoutRef.current = setTimeout(() => {
        isPausedAtStopRef.current = false
        
        // Move to next segment
        if (currentSegmentIndexRef.current < segments.length - 1) {
          currentSegmentIndexRef.current++
          segmentProgressRef.current = 0
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          // Animation complete
          setState("finished")
          onAnimationComplete?.()
        }
      }, config.pauseAtStops)
      
      return
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [config.speed, config.pauseAtStops, calculateAvatarPosition, onPositionChange, onActivityReached, onAnimationComplete])

  const reset = useCallback(() => {
    setState("idle")
    stateRef.current = "idle"
    currentSegmentIndexRef.current = 0
    segmentProgressRef.current = 0
    isPausedAtStopRef.current = false
    setCurrentActivityIndex(0)
    setProgress(0)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    
    // Set initial position
    if (activities.length > 0) {
      const initialPosition: AvatarPosition = {
        coordinate: activities[0].coordinates,
        bearing: segmentsRef.current[0]?.bearing || 0,
        progress: 0,
        currentSegmentIndex: 0,
        isAtStop: true,
        currentActivityIndex: 0,
      }
      setPosition(initialPosition)
    } else {
      setPosition(null)
    }
  }, [activities])

  const play = useCallback(() => {
    if (activities.length < 2) return
    
    if (stateRef.current === "finished") {
      reset()
      // Small delay to let reset complete
      setTimeout(() => {
        setState("playing")
        stateRef.current = "playing"
        lastTimeRef.current = 0
        animationFrameRef.current = requestAnimationFrame(animate)
      }, 50)
      return
    }
    
    setState("playing")
    stateRef.current = "playing"
    lastTimeRef.current = 0
    
    // Initialize position if at start
    if (currentSegmentIndexRef.current === 0 && segmentProgressRef.current === 0) {
      const initialPosition = calculateAvatarPosition()
      if (initialPosition) {
        setPosition(initialPosition)
        onPositionChange?.(initialPosition)
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [activities.length, animate, calculateAvatarPosition, onPositionChange, reset])

  const pause = useCallback(() => {
    setState("paused")
    stateRef.current = "paused"
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }, [])

  const jumpToActivity = useCallback((index: number) => {
    if (index < 0 || index >= activities.length) return
    
    pause()
    
    currentSegmentIndexRef.current = Math.min(index, segmentsRef.current.length - 1)
    segmentProgressRef.current = 0
    setCurrentActivityIndex(index)
    
    const newPosition: AvatarPosition = {
      coordinate: activities[index].coordinates,
      bearing: segmentsRef.current[index]?.bearing || 0,
      progress: activities.length > 1 ? index / (activities.length - 1) : 0,
      currentSegmentIndex: currentSegmentIndexRef.current,
      isAtStop: true,
      currentActivityIndex: index,
    }
    
    setPosition(newPosition)
    setProgress(newPosition.progress)
    onPositionChange?.(newPosition)
    setState("paused")
    stateRef.current = "paused"
  }, [activities, pause, onPositionChange])

  // Build segments when activities change
  const activitiesKey = JSON.stringify(activities.map(a => a.id))
  
  useEffect(() => {
    if (activities.length >= 2) {
      segmentsRef.current = buildRouteSegments(activities)
    } else {
      segmentsRef.current = []
    }
    
    // Initialize position
    if (activities.length > 0) {
      const initialPosition: AvatarPosition = {
        coordinate: activities[0].coordinates,
        bearing: segmentsRef.current[0]?.bearing || 0,
        progress: 0,
        currentSegmentIndex: 0,
        isAtStop: true,
        currentActivityIndex: 0,
      }
      setPosition(initialPosition)
    }
    
    // Reset state
    setState("idle")
    stateRef.current = "idle"
    currentSegmentIndexRef.current = 0
    segmentProgressRef.current = 0
    setCurrentActivityIndex(0)
    setProgress(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitiesKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    position,
    currentActivityIndex,
    progress,
    play,
    pause,
    reset,
    jumpToActivity,
  }
}
