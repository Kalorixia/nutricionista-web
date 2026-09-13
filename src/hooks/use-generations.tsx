import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { mealPlansService } from "@/services/mealPlans.service"
import type { GeneracionPlan } from "@/types/mealPlan"

/**
 * Seguimiento de los borradores que el Copiloto está generando.
 *
 * Vive por encima de las rutas a propósito: el pedido tarda hasta dos minutos y
 * el nutricionista tiene que poder irse a otra pantalla mientras tanto. El
 * estado real está en el backend, así que esto se limita a consultarlo y avisar
 * cuando algo termina; recargar la página no pierde nada.
 */
const POLL_MS = 4000

interface GenerationsValue {
  active: GeneracionPlan[]
  track: (generacion: GeneracionPlan) => void
}

const GenerationsContext = createContext<GenerationsValue | null>(null)

export function GenerationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [active, setActive] = useState<GeneracionPlan[]>([])
  const navigate = useNavigate()
  // Lo que ya estaba en curso la vuelta anterior. Sirve para avisar una sola
  // vez por generación, incluso si el componente se vuelve a montar.
  const seen = useRef<Set<number>>(new Set())
  const announced = useRef<Set<number>>(new Set())

  const announce = useCallback(
    (generacion: GeneracionPlan) => {
      if (announced.current.has(generacion.id_generacion)) return
      announced.current.add(generacion.id_generacion)
      const nombre = generacion.nombre || "El borrador"
      if (generacion.estado === "completada" && generacion.id_planificacion) {
        const id = generacion.id_planificacion
        toast.success(`${nombre} está listo para revisar`, {
          duration: 10000,
          action: {
            label: "Ver borrador",
            onClick: () => navigate(`/planificacion/${id}`),
          },
        })
      } else if (generacion.estado === "fallida") {
        toast.error(
          generacion.error_mensaje || `No se pudo generar ${nombre}.`,
          { duration: 10000 }
        )
      }
    },
    [navigate]
  )

  const refresh = useCallback(async () => {
    let current: GeneracionPlan[]
    try {
      current = await mealPlansService.activeGenerations()
    } catch {
      // Un fallo de red no debe cortar el seguimiento: se reintenta al próximo
      // ciclo y el estado sigue estando en el backend.
      return
    }
    const stillRunning = new Set(current.map((item) => item.id_generacion))
    const finished = [...seen.current].filter((id) => !stillRunning.has(id))
    seen.current = stillRunning
    setActive(current)

    for (const id of finished) {
      try {
        announce(await mealPlansService.generationStatus(id))
      } catch {
        announced.current.add(id)
      }
    }
  }, [announce])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const track = useCallback((generacion: GeneracionPlan) => {
    seen.current.add(generacion.id_generacion)
    setActive((previous) =>
      previous.some((item) => item.id_generacion === generacion.id_generacion)
        ? previous
        : [...previous, generacion]
    )
  }, [])

  return (
    <GenerationsContext.Provider value={{ active, track }}>
      {children}
    </GenerationsContext.Provider>
  )
}

export function useGenerations() {
  const value = useContext(GenerationsContext)
  if (!value) {
    throw new Error("useGenerations requiere GenerationsProvider")
  }
  return value
}
