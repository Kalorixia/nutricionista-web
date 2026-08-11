// MOCK — no existe todavía un módulo de planificación en el backend.
// Reemplazar por endpoints reales (ej. /nutricionistas/me/planes) cuando
// se implemente la planificación de dietas del lado del servidor.
import type { DiaPlan, MealPlan } from "@/types/mealPlan"
import { DIAS_SEMANA, SLOTS_POR_DEFECTO } from "@/types/mealPlan"

function diasVacios(): DiaPlan[] {
  return DIAS_SEMANA.map((dia) => ({
    dia,
    comidas: Object.fromEntries(SLOTS_POR_DEFECTO.map((s) => [s.id, []])),
  }))
}

export const mealPlans: MealPlan[] = [
  {
    id: "plan_ejemplo_1",
    nombre: "Plan de ejemplo — déficit calórico",
    objetivo: "Bajar de peso",
    id_paciente: null,
    nombre_paciente: null,
    estado: "borrador",
    slots: SLOTS_POR_DEFECTO,
    dias: diasVacios(),
    fecha_creacion: "2026-08-01T10:00:00.000Z",
    fecha_publicacion: null,
  },
]

export function crearPlanVacio(nombre: string, objetivo: string): MealPlan {
  return {
    id: `plan_${Math.random().toString(36).slice(2, 10)}`,
    nombre,
    objetivo,
    id_paciente: null,
    nombre_paciente: null,
    estado: "borrador",
    slots: SLOTS_POR_DEFECTO,
    dias: diasVacios(),
    fecha_creacion: new Date().toISOString(),
    fecha_publicacion: null,
  }
}
