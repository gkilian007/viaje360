"use client"

import { motion } from "framer-motion"

interface TravelerAvatarProps {
  bearing: number
  isMoving: boolean
  size?: number
}

export function TravelerAvatar({ bearing, isMoving, size = 48 }: TravelerAvatarProps) {
  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        transform: `rotate(${bearing - 90}deg)`, // Adjust for pointing direction
      }}
      animate={isMoving ? {
        y: [0, -3, 0],
      } : {}}
      transition={{
        duration: 0.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Avatar container */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0A84FF, #5856D6)",
          boxShadow: isMoving 
            ? "0 4px 20px rgba(10, 132, 255, 0.5), 0 0 30px rgba(88, 86, 214, 0.3)"
            : "0 2px 10px rgba(10, 132, 255, 0.3)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Inner circle */}
        <div
          className="absolute inset-1 rounded-full bg-[#0f1117] flex items-center justify-center"
        >
          {/* Traveler icon */}
          <motion.span
            className="material-symbols-outlined text-white"
            style={{ 
              fontSize: size * 0.5,
              fontVariationSettings: "'FILL' 1",
            }}
            animate={isMoving ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            hiking
          </motion.span>
        </div>
      </div>

      {/* Direction indicator */}
      <div
        className="absolute -right-1 top-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: "10px solid #0A84FF",
          filter: "drop-shadow(0 0 4px rgba(10, 132, 255, 0.5))",
        }}
      />

      {/* Pulse effect when moving */}
      {isMoving && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid #0A84FF",
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </motion.div>
  )
}

// Marker for the avatar on the map (HTML element for Mapbox)
export function createAvatarMarkerElement(isMoving: boolean = false): HTMLDivElement {
  const container = document.createElement("div")
  container.style.cssText = `
    width: 48px;
    height: 48px;
    position: relative;
    transition: transform 0.3s ease;
  `

  // Main avatar circle
  const avatarCircle = document.createElement("div")
  avatarCircle.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #0A84FF, #5856D6);
    box-shadow: ${isMoving 
      ? "0 4px 20px rgba(10, 132, 255, 0.5), 0 0 30px rgba(88, 86, 214, 0.3)"
      : "0 2px 10px rgba(10, 132, 255, 0.3)"};
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ${isMoving ? "avatarBounce 0.4s ease-in-out infinite" : "none"};
  `

  // Inner circle
  const innerCircle = document.createElement("div")
  innerCircle.style.cssText = `
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: #0f1117;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // Icon
  const icon = document.createElement("span")
  icon.className = "material-symbols-outlined"
  icon.textContent = "hiking"
  icon.style.cssText = `
    font-size: 24px;
    color: white;
    font-variation-settings: 'FILL' 1;
    animation: ${isMoving ? "iconPulse 0.4s ease-in-out infinite" : "none"};
  `

  // Direction arrow
  const arrow = document.createElement("div")
  arrow.style.cssText = `
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 10px solid #0A84FF;
    filter: drop-shadow(0 0 4px rgba(10, 132, 255, 0.5));
  `

  // Pulse ring (only when moving)
  if (isMoving) {
    const pulseRing = document.createElement("div")
    pulseRing.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid #0A84FF;
      animation: pulseRing 1.5s ease-out infinite;
    `
    container.appendChild(pulseRing)
  }

  innerCircle.appendChild(icon)
  avatarCircle.appendChild(innerCircle)
  container.appendChild(avatarCircle)
  container.appendChild(arrow)

  // Add keyframe styles
  const style = document.createElement("style")
  style.textContent = `
    @keyframes avatarBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    @keyframes iconPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    @keyframes pulseRing {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  `
  container.appendChild(style)

  return container
}

// Update avatar marker state
export function updateAvatarMarker(element: HTMLDivElement, isMoving: boolean, bearing: number) {
  element.style.transform = `rotate(${bearing - 90}deg)`
  
  // Update animations
  const avatarCircle = element.querySelector("div") as HTMLDivElement
  if (avatarCircle) {
    avatarCircle.style.animation = isMoving ? "avatarBounce 0.4s ease-in-out infinite" : "none"
    avatarCircle.style.boxShadow = isMoving 
      ? "0 4px 20px rgba(10, 132, 255, 0.5), 0 0 30px rgba(88, 86, 214, 0.3)"
      : "0 2px 10px rgba(10, 132, 255, 0.3)"
  }

  const icon = element.querySelector(".material-symbols-outlined") as HTMLSpanElement
  if (icon) {
    icon.style.animation = isMoving ? "iconPulse 0.4s ease-in-out infinite" : "none"
  }
}
