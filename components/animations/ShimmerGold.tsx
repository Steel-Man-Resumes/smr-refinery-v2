'use client'

import { motion } from 'framer-motion'

interface ShimmerGoldProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * ShimmerGold - Premium metallic shimmer effect for Refinery
 * Creates a sweeping golden highlight across text/elements
 */
export function ShimmerGold({ children, className = '', delay = 0 }: ShimmerGoldProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-gold-light/40 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
          delay,
        }}
        style={{ 
          mixBlendMode: 'overlay',
        }}
      />
    </span>
  )
}

/**
 * MetallicShine - Radial metallic highlight effect
 * Follows mouse position for interactive shine
 */
interface MetallicShineProps {
  children: React.ReactNode
  className?: string
}

export function MetallicShine({ children, className = '' }: MetallicShineProps) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      whileHover="hover"
    >
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={{
          hover: {
            background: [
              'radial-gradient(circle at 0% 0%, rgba(232, 192, 96, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(232, 192, 96, 0.3) 0%, transparent 50%)',
            ],
          },
        }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />
    </motion.div>
  )
}

/**
 * GoldenPulse - Subtle pulsing glow effect
 * For premium CTAs and important elements
 */
interface GoldenPulseProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'intense'
}

export function GoldenPulse({ children, className = '', intensity = 'medium' }: GoldenPulseProps) {
  const glowValues = {
    subtle: ['0 0 10px rgba(212, 168, 75, 0.3)', '0 0 20px rgba(212, 168, 75, 0.5)'],
    medium: ['0 0 15px rgba(212, 168, 75, 0.4)', '0 0 30px rgba(212, 168, 75, 0.7)'],
    intense: ['0 0 20px rgba(212, 168, 75, 0.5)', '0 0 50px rgba(212, 168, 75, 0.9)'],
  }

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: glowValues[intensity],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

export default ShimmerGold
