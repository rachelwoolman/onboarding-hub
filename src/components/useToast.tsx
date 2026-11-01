import { useEffect, useState } from 'react'

/** A quiet message near the bottom of the screen that fades after a moment. */
export function useToast(ms = 2800) {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null)
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), ms)
    return () => window.clearTimeout(t)
  }, [message, ms])
  const show = (text: string) => setMessage({ id: Date.now(), text })
  const node = (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      {message && (
        <p key={message.id} className="animate-fade-up rounded-full bg-ink px-5 py-3 text-center text-[14px] text-paper shadow-card">
          {message.text}
        </p>
      )}
    </div>
  )
  return { show, node }
}
