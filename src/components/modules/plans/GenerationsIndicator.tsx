import { Loader2 } from "lucide-react"
import { useGenerations } from "@/hooks/use-generations"

/**
 * Qué está generando el Copiloto ahora mismo.
 *
 * Acompaña al aviso por toast, que es momentáneo: si el profesional estaba en
 * otra pantalla cuando disparó la generación, o recargó la página, esto le
 * recuerda que hay algo en curso y que no hace falta volver a pedirlo.
 */
export function GenerationsIndicator() {
  const { active } = useGenerations()
  if (!active.length) return null

  const nombres = active.map((item) => item.nombre || "Borrador").join(", ")

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm"
    >
      <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />
      <span className="truncate">
        {active.length === 1
          ? `Generando ${nombres}…`
          : `Generando ${active.length} borradores…`}
      </span>
    </div>
  )
}
