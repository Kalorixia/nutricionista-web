// MOCK — ver services/mocks/mealPlans.mock.ts. La generación con IA
// (generateWithAI) también es mock: no hay endpoint real todavía, así que
// devuelve una respuesta de ejemplo simulada.
import { crearPlanVacio, mealPlans } from "@/services/mocks/mealPlans.mock"
import { delay } from "@/services/mockUtils"
import { recipes } from "@/services/mocks/recipes.mock"
import { DIAS_SEMANA, SLOTS_POR_DEFECTO } from "@/types/mealPlan"
import type { DiaPlan, MealPlan } from "@/types/mealPlan"

function findOrThrow(id: string): MealPlan {
  const plan = mealPlans.find((p) => p.id === id)
  if (!plan) throw new Error("Plan no encontrado")
  return plan
}

export const mealPlansService = {
  async list(): Promise<MealPlan[]> {
    return delay(
      [...mealPlans].sort((a, b) =>
        b.fecha_creacion.localeCompare(a.fecha_creacion)
      )
    )
  },

  async get(id: string): Promise<MealPlan> {
    return delay(findOrThrow(id))
  },

  async create(nombre: string, objetivo: string): Promise<MealPlan> {
    const plan = crearPlanVacio(nombre, objetivo)
    mealPlans.unshift(plan)
    return delay(plan)
  },

  async update(id: string, dias: DiaPlan[]): Promise<MealPlan> {
    const plan = findOrThrow(id)
    plan.dias = dias
    return delay(plan)
  },

  async remove(id: string): Promise<void> {
    const index = mealPlans.findIndex((p) => p.id === id)
    if (index !== -1) mealPlans.splice(index, 1)
    return delay(undefined, 50)
  },

  async approve(id: string): Promise<MealPlan> {
    const plan = findOrThrow(id)
    if (plan.estado !== "borrador") {
      throw new Error("Solo se puede aprobar un plan en borrador")
    }
    plan.estado = "aprobada"
    return delay(plan)
  },

  async publish(
    id: string,
    idPaciente: number,
    nombrePaciente: string
  ): Promise<MealPlan> {
    const plan = findOrThrow(id)
    if (plan.estado !== "aprobada") {
      throw new Error("Solo se puede publicar un plan aprobado")
    }
    plan.estado = "publicada"
    plan.id_paciente = idPaciente
    plan.nombre_paciente = nombrePaciente
    plan.fecha_publicacion = new Date().toISOString()
    return delay(plan)
  },

  async unpublish(id: string): Promise<MealPlan> {
    const plan = findOrThrow(id)
    plan.estado = "aprobada"
    plan.id_paciente = null
    plan.nombre_paciente = null
    plan.fecha_publicacion = null
    return delay(plan)
  },

  /**
   * Simulación de generación con IA: no hay endpoint real todavía, así que
   * arma un plan de ejemplo repartiendo recetas del catálogo mock entre los
   * slots definidos. Reemplazar por una llamada real cuando exista.
   */
  async generateWithAI(): Promise<DiaPlan[]> {
    const recetaIds = recipes.map((r) => r.id)
    const dias: DiaPlan[] = DIAS_SEMANA.map((dia, diaIndex) => ({
      dia,
      comidas: Object.fromEntries(
        SLOTS_POR_DEFECTO.map((slot, slotIndex) => [
          slot.id,
          [recetaIds[(diaIndex + slotIndex) % recetaIds.length]],
        ])
      ),
    }))
    return delay(dias, 900)
  },
}
