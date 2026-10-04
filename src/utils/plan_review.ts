import { DIAS_SEMANA, MOMENTOS_COMIDA } from "@/types/mealPlan"
import type {
  PlanificacionDetalle,
  PlanificacionRecetaItem,
} from "@/types/mealPlan"

const normalize = (value: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

export function slot_key(
  item: Pick<PlanificacionRecetaItem, "dia_semana" | "momento_comida">
) {
  const day = DIAS_SEMANA.find(
    (value) => normalize(value) === normalize(item.dia_semana)
  )
  const meal = MOMENTOS_COMIDA.find(
    (value) => normalize(value) === normalize(item.momento_comida)
  )
  return day && meal ? `${day}|${meal}` : null
}

export function review_summary(plan: PlanificacionDetalle) {
  const assigned = new Set(plan.recetas.map(slot_key).filter(Boolean))
  const missing = DIAS_SEMANA.flatMap((day) =>
    MOMENTOS_COMIDA.filter((meal) => !assigned.has(`${day}|${meal}`)).map(
      (meal) => `${day}: ${meal}`
    )
  )
  const outside = plan.recetas.filter((item) => !slot_key(item))
  // Lo que el backend no pudo comprobar viaja hasta el momento de aprobar: es
  // ahí donde el profesional asume la responsabilidad del plan.
  const unverified = plan.generacion_ia?.sin_verificar ?? []
  return {
    missing,
    outside,
    unverified,
    description: `${plan.nombre} para ${plan.nombre_paciente}. ${plan.recetas.length} comidas, ${assigned.size} de 28 momentos cubiertos.`,
  }
}
