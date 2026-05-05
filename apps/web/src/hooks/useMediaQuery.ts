import { useEffect } from "react"
import { useSignal } from "@preact/signals";

export function useMediaQuery(query: string) {
  const value = useSignal(false)

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      value.value = event.matches
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    value.value = result.matches

    return () => result.removeEventListener("change", onChange)
  }, [query, value])

  return value.value
}
