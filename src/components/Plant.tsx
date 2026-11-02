import { useId, type CSSProperties } from 'react'
import type { PlantStage } from '../data/types'

const RANK: Record<PlantStage, number> = { seed: 0, sprout: 1, leafy: 2, flowering: 3, bloom: 4 }

interface PlantProps {
  stage: PlantStage
  size?: number
  /** Drooping, slightly faded plant (blocked hire). */
  droop?: boolean
  className?: string
  title?: string
}

/** A leaf growing out from the stem at (60, y), pointing left or right. */
function leaf(y: number, len: number, side: 'left' | 'right'): string {
  const d = side === 'left' ? -1 : 1
  const x = (k: number) => 60 + d * len * k
  return `M60 ${y} C ${x(0.25)} ${y - len * 0.5}, ${x(0.8)} ${y - len * 0.55}, ${x(1)} ${y - len * 0.2} C ${x(0.75)} ${y + len * 0.2}, ${x(0.3)} ${y + len * 0.2}, 60 ${y} Z`
}

/**
 * Hand-built plant, always growing from a small sprout (never a bare seed):
 * sprout (0%), small plant (>0%), leafy (>=60%), flowering (a half-open flower, used while
 * an approval is pending) and full bloom.
 * Every part is always rendered and scales in from where it attaches, so stages animate.
 */
export function Plant({ stage, size = 120, droop = false, className = '', title }: PlantProps) {
  const uid = useId().replace(/:/g, '')
  const rank = RANK[stage]
  const grow = (minRank: number, origin: string, scaleBelow = 0.2): CSSProperties => ({
    opacity: rank >= minRank ? 1 : 0,
    transform: `scale(${rank >= minRank ? 1 : scaleBelow})`,
    transformOrigin: origin,
  })

  // Stem tops out higher at each stage.
  const stemTop = [76, 58, 44, 38, 34][rank]
  const leafA = `url(#leaf-${uid})`
  const leafB = `url(#leaf2-${uid})`

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label={title ?? `Plant: ${stage}`}>
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="#dcebd7" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#e9f1e7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f7f4ec" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6cbd8a" />
          <stop offset="100%" stopColor="#3b9563" />
        </linearGradient>
        <linearGradient id={`leaf2-${uid}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#84c99c" />
          <stop offset="100%" stopColor="#4ea672" />
        </linearGradient>
      </defs>

      {/* Soft glow, brighter as the plant grows. */}
      <circle cx="60" cy="64" r="56" fill={`url(#glow-${uid})`} style={{ opacity: 0.6 + rank * 0.1, transition: 'opacity 900ms' }} />

      {/* Soil */}
      <ellipse cx="60" cy="99" rx="31" ry="7" fill="#c9a582" opacity="0.9" />
      <ellipse cx="60" cy="97.5" rx="25" ry="4" fill="#d8bb9c" />

      {/* Everything above the soil sways gently from the base. */}
      <g className={droop ? '' : 'animate-sway'} style={{ transformOrigin: '60px 97px', transformBox: 'view-box' }}>
        <g
          style={{
            transformOrigin: '60px 97px',
            transformBox: 'view-box',
            transform: droop ? 'rotate(14deg)' : 'none',
            filter: droop ? 'saturate(0.6)' : 'none',
            transition: 'transform 900ms, filter 900ms',
          }}
        >
          {/* Stem */}
          <path
            d={`M60 97 C 61.5 ${(97 + stemTop) / 2 + 6}, 58.5 ${(97 + stemTop) / 2 - 6}, 60 ${stemTop}`}
            stroke="#3f8a5d"
            strokeWidth={2.6 + rank * 0.4}
            strokeLinecap="round"
            fill="none"
          />

          {/* First pair: two tiny leaves on the sprout, full size from stage 1. */}
          <g className="plant-part" style={{ transformOrigin: '60px 80px', transformBox: 'view-box', transform: `scale(${rank >= 1 ? 1 : 0.62})` }}>
            <path d={leaf(80, 26, 'left')} fill={leafA} />
            <path d={leaf(78, 26, 'right')} fill={leafB} />
          </g>

          {/* Stage 1: a second, higher pair. */}
          <path className="plant-part" d={leaf(62, 22, 'left')} fill={leafB} style={grow(1, '100% 60%')} />
          <path className="plant-part" d={leaf(60, 23, 'right')} fill={leafA} style={grow(1, '0% 60%')} />

          {/* Stage 2: leafy, two more pairs. */}
          <path className="plant-part" d={leaf(50, 19, 'left')} fill={leafA} style={grow(2, '100% 70%')} />
          <path className="plant-part" d={leaf(47, 20, 'right')} fill={leafB} style={grow(2, '0% 70%')} />
          <path className="plant-part" d={leaf(70, 18, 'right')} fill={leafB} style={grow(2, '0% 70%')} />

          {/* Flowering: a smaller, half-open flower (only until full bloom). */}
          <g
            className="plant-part"
            style={{ opacity: rank === 3 ? 1 : 0, transform: `scale(${rank === 3 ? 1 : 0.3})`, transformOrigin: '50% 100%' }}
          >
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="60" cy="32" rx="4" ry="6" fill="#f2c4b3" opacity="0.9" transform={`rotate(${r} 60 38)`} />
            ))}
            <circle cx="60" cy="38" r="3.4" fill="#f0b45b" />
          </g>

          {/* Full bloom: a soft five-petal flower and a bud. */}
          <g className="plant-part" style={grow(4, '50% 100%')}>
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="60" cy="25" rx="6.5" ry="9.5" fill="#f2c4b3" transform={`rotate(${r} 60 34)`} />
            ))}
            <circle cx="60" cy="34" r="5" fill="#f0b45b" />
          </g>
          <g className="plant-part" style={grow(4, '0% 100%')}>
            <path d="M60 56 C 66 52, 72 48, 76 42" stroke="#3f8a5d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="77" cy="40" rx="3.6" ry="5" fill="#f2c4b3" transform="rotate(30 77 40)" />
          </g>
        </g>
      </g>
    </svg>
  )
}
