import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const TEXT = "kalorixia"
const GREEN_START = 6 // "kalori" black, "xia" green

interface Props {
  className?: string
  size?: "sm" | "md" | "lg"
  fullscreen?: boolean
}

export default function KalorixiaLoader({
  className,
  size = "md",
  fullscreen = false,
}: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c >= TEXT.length ? 0 : c + 1))
    }, 180)
    return () => clearInterval(id)
  }, [])

  const sizeCls =
    size === "lg"
      ? "text-5xl lg:text-6xl"
      : size === "sm"
        ? "text-2xl"
        : "text-4xl"

  const content = (
    <div className={cn("flex items-center justify-center", className)}>
      <span
        className={cn(
          "font-heading font-bold tracking-tight text-slate-900 select-none dark:text-slate-100",
          sizeCls
        )}
        aria-label="Cargando"
      >
        {TEXT.split("").map((ch, i) => (
          <span
            key={i}
            className={cn(
              "transition-opacity duration-150",
              i < count ? "opacity-100" : "opacity-0",
              i >= GREEN_START && "text-emerald-500"
            )}
          >
            {ch}
          </span>
        ))}
        <span
          className="ml-0.5 inline-block w-[2px] animate-pulse bg-emerald-500 align-middle"
          style={{ height: "0.9em" }}
        />
      </span>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {content}
      </div>
    )
  }
  return content
}
