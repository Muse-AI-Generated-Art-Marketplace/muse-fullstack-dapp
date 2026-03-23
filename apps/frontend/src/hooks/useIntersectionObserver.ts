import { useCallback, useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  onIntersect: () => void
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver({
  onIntersect,
  threshold = 0.1,
  rootMargin = '200px',
  enabled = true,
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && enabled) {
        onIntersect()
      }
    },
    [onIntersect, enabled]
  )

  useEffect(() => {
    if (!enabled || !targetRef.current) return

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    })

    observer.observe(targetRef.current)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersect, threshold, rootMargin, enabled])

  return targetRef
}
