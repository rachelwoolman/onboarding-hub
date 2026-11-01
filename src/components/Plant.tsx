import { useId, type CSSProperties } from 'react'
import type { PlantStage } from '../data/types'

const RANK: Record<PlantStage, number> = { seed: 0, sprout: 1, leafy: 2, bloom: 3 }

interface PlantProps {
  stage: PlantStage
  size?: number
  /** Drooping, slightly faded plant (blocked hire). */
  droop?: boolean
  className?: string
  title?: string
}

/**
 * Hand-built plant with four growth stages. Every part is always rendered and
 * fades/scales in from where it attaches, so moving between stages animates smoothly.
 */
export function Plant({ stage, size = 120, droop = false, className = '', title }: PlantProps) {
  const uid = useId().replace(/:/g, '')
  const rank = RANK[stage]
  const show = (minRank: number, origin: string, extra = ''): CSSProperties => ({
    opacity: rank >= minRank ? 1 : 0,
    transform: `${extra} scale(${rank >= minRank ? 1 : 0.2})`,
    transformOrigin: origin,
  })

  // Stem grows taller with each stage.
  const stemTop = [92, 70, 50, 38][rank]

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? `Plant: ${stage}`}
    >
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
      <circle
        cx="60"
        cy="66"
        r="56"
        fill={`url(#glow-${uid})`}
        style={{ opacity: 0.55 + rank * 0.15, transition: 'opacity 900ms' }}
      />

      {/* Soil */}
      <ellipse cx="60" cy="98" rx="30" ry="7" fill="#c9a582" opacity="0.9" />
      <ellipse cx="60" cy="96.5" rx="24" ry="4" fill="#d8bb9c" />

      {/* Seed, visible only before anything has grown. */}
      <g
        className="plant-part"
        style={{ opacity: rank === 0 ? 1 : 0, transform: `scale(${rank === 0 ? 1 : 0.6})`, transformOrigin: 'center' }}
      >
        <ellipse cx="60" cy="93" rx="7" ry="5" fill="#a87b55" transform="rotate(-18 60 93)" />
        <path d="M56 91.5 q4 -2.5 8 0" stroke="#8a6040" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* Everything above the soil sways gently from the base. */}
      <g
        className={droop ? '' : 'animate-sway'}
        style={{ transformOrigin: '60px 96px', transformBox: 'view-box' }}
      >
        <g
          style={{
            transformOrigin: '60px 96px',
            transformBox: 'view-box',
            transform: droop ? 'rotate(14deg)' : 'none',
            filter: droop ? 'saturate(0.6)' : 'none',
            transition: 'transform 900ms, filter 900ms',
          }}
        >
          {/* Stem */}
          <path
            d={`M60 96 C 61 ${(96 + stemTop) / 2 + 6}, 58 ${(96 + stemTop) / 2 - 6}, 60 ${stemTop}`}
            stroke="#3f8a5d"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            style={{ opacity: rank >= 1 ? 1 : 0, transition: 'd 900ms var(--ease-soft), opacity 500ms' }}
          />

          {/* Sprout: two first leaves at the top of a young stem. */}
          <path
            className="plant-part"
            d="M60 72 C 52 62, 40 62, 34 68 C 42 76, 54 76, 60 72 Z"
            fill={`url(#leaf-${uid})`}
            style={{
              ...show(1, '100% 60%'),
              transform: `translateY(${rank >= 2 ? 10 : 0}px) scale(${rank >= 1 ? 1 : 0.2})`,
            }}
          />
          <path
            className="plant-part"
            d="M60 70 C 66 58, 80 56, 88 62 C 80 72, 68 74, 60 70 Z"
            fill={`url(#leaf2-${uid})`}
            style={{
              ...show(1, '0% 70%'),
              transform: `translateY(${rank >= 2 ? 6 : 0}px) scale(${rank >= 1 ? 1 : 0.2})`,
            }}
          />

          {/* Leafy: two more leaves higher up. */}
          <path
            className="plant-part"
            d="M60 58 C 54 48, 44 46, 38 50 C 44 58, 54 60, 60 58 Z"
            fill={`url(#leaf2-${uid})`}
            style={show(2, '100% 80%')}
          />
          <path
            className="plant-part"
            d="M60 54 C 64 44, 74 42, 80 46 C 76 54, 66 57, 60 54 Z"
            fill={`url(#leaf-${uid})`}
            style={show(2, '0% 80%')}
          />

          {/* Bloom: a soft five-petal flower. */}
          <g className="plant-part" style={show(3, '50% 100%')}>
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse
                key={r}
                cx="60"
                cy="30"
                rx="5.5"
                ry="8"
                fill="#f2c4b3"
                transform={`rotate(${r} 60 38)`}
              />
            ))}
            <circle cx="60" cy="38" r="4.5" fill="#f0b45b" />
          </g>
        </g>
      </g>
    </svg>
  )
}
