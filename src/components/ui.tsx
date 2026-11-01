import type { ButtonHTMLAttributes, CSSProperties, ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronIcon({ open, ...props }: IconProps & { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 300ms var(--ease-soft)' }}
      {...props}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3.2l2 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Small leaf used as a brand mark and on the journey vine. */
export function LeafIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path d="M2 14C2 7 6.5 2.5 14 2c0 7.5-4.5 12-12 12z" fill="currentColor" />
      <path d="M3.5 12.5L10 6" stroke="#fffefb" strokeOpacity="0.6" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

/** The one chip style used everywhere. */
export function Chip({
  children,
  tone = 'sage',
  className = '',
}: {
  children: ReactNode
  tone?: 'sage' | 'muted' | 'mist' | 'amber'
  className?: string
}) {
  const tones = {
    sage: 'bg-sage text-leaf-deep',
    muted: 'bg-paper text-ink-muted ring-1 ring-line',
    mist: 'bg-mist-soft text-mist',
    amber: 'bg-amber-soft text-amber',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-7 py-3 text-[15px] font-semibold text-paper shadow-button transition duration-200 hover:bg-leaf-deep active:scale-[0.98] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const PETALS = [
  { dx: '-46px', dy: '-60px', rot: '-120deg', color: '#f2c4b3', delay: 0 },
  { dx: '38px', dy: '-72px', rot: '140deg', color: '#5cb27e', delay: 60 },
  { dx: '-20px', dy: '-86px', rot: '80deg', color: '#f0b45b', delay: 120 },
  { dx: '58px', dy: '-40px', rot: '-60deg', color: '#f2c4b3', delay: 30 },
  { dx: '-62px', dy: '-28px', rot: '100deg', color: '#84c99c', delay: 90 },
  { dx: '12px', dy: '-96px', rot: '-160deg', color: '#f2c4b3', delay: 150 },
]

/** A few petals drift up from the centre of the parent. Re-key to replay. */
export function Bloom() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
      {PETALS.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 10 10"
          className="petal absolute size-2.5"
          style={
            {
              '--dx': p.dx,
              '--dy': p.dy,
              '--rot': p.rot,
              animationDelay: `${p.delay}ms`,
              opacity: 0,
            } as CSSProperties
          }
        >
          <ellipse cx="5" cy="5" rx="3" ry="5" fill={p.color} />
        </svg>
      ))}
    </span>
  )
}
