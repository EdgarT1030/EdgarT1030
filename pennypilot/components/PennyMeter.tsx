'use client'

import { useEffect, useRef, useState } from 'react'

const R = 28                          // arc radius
const CX = 40                         // SVG centre x
const CY = 40                         // SVG centre y
const CIRC = 2 * Math.PI * R         // ≈ 175.9

function tierColor(score: number) {
  if (score >= 80) return '#E8A04C'   // copper-bright — minted
  if (score >= 45) return '#B66E41'   // copper — warming up
  return '#8B5432'                    // copper-dim — tarnished
}

// 12 tick marks around the coin edge (coin ribbing)
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 - 90) * (Math.PI / 180)
  const r1 = 33.5
  const r2 = 36.5
  return {
    x1: CX + r1 * Math.cos(a), y1: CY + r1 * Math.sin(a),
    x2: CX + r2 * Math.cos(a), y2: CY + r2 * Math.sin(a),
  }
})

interface PennyMeterProps {
  score: number
  /** Outer diameter in px. Default 64. */
  size?: number
  /** Show "score" sub-label. Default true. */
  showLabel?: boolean
  className?: string
}

export default function PennyMeter({
  score,
  size = 64,
  showLabel = true,
  className = '',
}: PennyMeterProps) {
  const [animated, setAnimated] = useState(false)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // One rAF delay so the initial render (full offset = empty) is committed
    // before we switch to the final offset and CSS transition kicks in.
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const targetOffset = CIRC * (1 - score / 100)
  const dashOffset   = animated ? targetOffset : CIRC

  const color   = tierColor(score)
  const isPenny = score === 100
  const showGlow = score >= 80
  const glowId   = `penny-glow-s${score}`

  return (
    <span
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Penny probability score: ${score} out of 100`}
      className={`inline-block ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        overflow="visible"
        aria-hidden="true"
      >
        {showGlow && (
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {/* Background track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#F2EDE4"
          strokeWidth="5"
        />

        {/* Coin ribbing — 12 tick marks */}
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.3"
          />
        ))}

        {/* Progress arc */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CX} ${CY})`}
          filter={showGlow ? `url(#${glowId})` : undefined}
          style={{
            transition:
              animated && !reducedMotion.current
                ? 'stroke-dashoffset 0.45s cubic-bezier(0.34, 1.2, 0.64, 1)'
                : 'none',
          }}
        />

        {/* Outer ping ring — only at 100 */}
        {isPenny && (
          <circle
            cx={CX} cy={CY} r={R + 6}
            fill="none"
            stroke="#E8A04C"
            strokeWidth="1.5"
            className="animate-ping-slow"
            opacity="0.4"
          />
        )}

        {/* Score number — Fraunces display font via CSS class */}
        <text
          x={CX}
          y={showLabel ? CY - 2 : CY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          className="font-display"
          style={{
            fontSize: isPenny ? 15 : score >= 100 ? 15 : 20,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          {isPenny ? '1¢' : score}
        </text>

        {/* Sub-label */}
        {showLabel && (
          <text
            x={CX}
            y={CY + 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#9B918C"
            className="font-sans"
            style={{ fontSize: 7, letterSpacing: '0.6px', fontWeight: 600 }}
          >
            {isPenny ? 'PENNY' : 'SCORE'}
          </text>
        )}
      </svg>
    </span>
  )
}
