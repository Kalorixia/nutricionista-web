import { authedFetch } from "@/services/http"
import type {
  ActualizarPlanificacionInput,
  CopiaPlan,
  GeneracionPlan,
  ListaCompra,
  ParametrosPlan,
  ParametrosPlanInput,
  Planificacion,
  PlanificacionDetalle,
  PlantillaResumen,
} from "@/types/mealPlan"

interface ListaPlanificacionesResponse {
  planificaciones: Planificacion[]
}

export interface CrearPlanificacionInput extends ParametrosPlanInput {
  id_paciente: number
  nombre: string
  descripcion?: string
  fecha_inicio?: string
  fecha_fin?: string
}

export interface AgregarRecetaInput {
  dia_semana: string
  momento_comida: string
  id_receta: number
}

export const mealPlansService = {
  /**
   * Pide un borrador al Copiloto. Responde apenas queda registrado el pedido,
   * sin esperar a la IA: el borrador se genera en segundo plano y su estado se
   * sigue con `generationStatus`.
   */
  async generate(
    input: CrearPlanificacionInput & {
      indicaciones?: string
      momentos?: string[]
    }
  ): Promise<GeneracionPlan> {
    return authedFetch<GeneracionPlan>("/copiloto/borradores", {
      method: "POST",
      body: input,
    })
  },

  /**
   * Objetivos sugeridos para un plan nuevo. Sin objetivo ni actividad, los del
   * paciente; con otros, los recalcula el servidor. No persiste nada.
   */
  async parameters(
    idPaciente: number,
    options: { id_objetivo?: number; id_nivel_actividad?: number } = {}
  ): Promise<ParametrosPlan> {
    const params = new URLSearchParams({ id_paciente: String(idPaciente) })
    if (options.id_objetivo)
      params.set("id_objetivo", String(options.id_objetivo))
    if (options.id_nivel_actividad)
      params.set("id_nivel_actividad", String(options.id_nivel_actividad))
    return authedFetch<ParametrosPlan>(`/planificaciones/parametros?${params}`)
  },

  async generationStatus(idGeneracion: number): Promise<GeneracionPlan> {
    return authedFetch<GeneracionPlan>(`/copiloto/generaciones/${idGeneracion}`)
  },

  /** Generaciones sin terminar del profesional; sobreviven a una recarga. */
  async activeGenerations(): Promise<GeneracionPlan[]> {
    const { generaciones } = await authedFetch<{
      generaciones: GeneracionPlan[]
    }>("/copiloto/generaciones")
    return generaciones
  },
  async list(idPaciente?: number): Promise<Planificacion[]> {
    const qs = idPaciente ? `?id_paciente=${idPaciente}` : ""
    const { planificaciones } = await authedFetch<ListaPlanificacionesResponse>(
      `/planificaciones${qs}`
    )
    return planificaciones
  },

  async get(id: number): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(`/planificaciones/${id}`)
  },

  async create(input: CrearPlanificacionInput): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>("/planificaciones", {
      method: "POST",
      body: input,
    })
  },

  /** Datos del plan. Vale para borradores y publicados (KAL-131-08). */
  async update(
    id: number,
    input: ActualizarPlanificacionInput
  ): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(`/planificaciones/${id}`, {
      method: "PATCH",
      body: input,
    })
  },

  /**
   * Copia un plan (o una plantilla) como borrador para un paciente. Lo que el
   * paciente no puede comer se quita y vuelve en `quitados` (KAL-132-03).
   */
  async duplicate(
    id: number,
    input: { id_paciente: number; nombre?: string }
  ): Promise<CopiaPlan> {
    return authedFetch<CopiaPlan>(`/planificaciones/${id}/duplicar`, {
      method: "POST",
      body: input,
    })
  },

  async saveAsTemplate(id: number, nombre?: string): Promise<CopiaPlan> {
    return authedFetch<CopiaPlan>(`/planificaciones/${id}/plantilla`, {
      method: "POST",
      body: nombre ? { nombre } : {},
    })
  },

  async templates(): Promise<PlantillaResumen[]> {
    const { plantillas } = await authedFetch<{
      plantillas: PlantillaResumen[]
    }>("/planificaciones/plantillas")
    return plantillas
  },

  async remove(id: number): Promise<void> {
    await authedFetch(`/planificaciones/${id}`, { method: "DELETE" })
  },

  async addRecipe(
    idPlan: number,
    input: AgregarRecetaInput
  ): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(
      `/planificaciones/${idPlan}/recetas`,
      { method: "POST", body: input }
    )
  },

  async removeRecipe(
    idPlan: number,
    idPlanificacionReceta: number
  ): Promise<void> {
    await authedFetch(
      `/planificaciones/${idPlan}/recetas/${idPlanificacionReceta}`,
      { method: "DELETE" }
    )
  },

  async publish(id: number): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(
      `/planificaciones/${id}/publicar`,
      {
        method: "POST",
      }
    )
  },

  async archive(id: number): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(
      `/planificaciones/${id}/archivar`,
      {
        method: "POST",
      }
    )
  },

  async generateShoppingList(id: number): Promise<ListaCompra> {
    return authedFetch<ListaCompra>(`/planificaciones/${id}/lista-compra`, {
      method: "POST",
    })
  },

  async getShoppingList(id: number): Promise<ListaCompra> {
    return authedFetch<ListaCompra>(`/planificaciones/${id}/lista-compra`)
  },

  async toggleShoppingItem(
    idPlan: number,
    idItem: number,
    comprado: boolean
  ): Promise<ListaCompra> {
    return authedFetch<ListaCompra>(
      `/planificaciones/${idPlan}/lista-compra/items/${idItem}`,
      { method: "PATCH", body: { comprado } }
    )
  },
}
