import { authedFetch } from "@/services/http"
import type {
  ListaCompra,
  Planificacion,
  PlanificacionDetalle,
} from "@/types/mealPlan"

interface ListaPlanificacionesResponse {
  planificaciones: Planificacion[]
}

export interface CrearPlanificacionInput {
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
  async list(idPaciente?: number): Promise<Planificacion[]> {
    const qs = idPaciente ? `?id_paciente=${idPaciente}` : ""
    const { planificaciones } =
      await authedFetch<ListaPlanificacionesResponse>(`/planificaciones${qs}`)
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

  async removeRecipe(idPlan: number, idPlanificacionReceta: number): Promise<void> {
    await authedFetch(
      `/planificaciones/${idPlan}/recetas/${idPlanificacionReceta}`,
      { method: "DELETE" }
    )
  },

  async publish(id: number): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(`/planificaciones/${id}/publicar`, {
      method: "POST",
    })
  },

  async archive(id: number): Promise<PlanificacionDetalle> {
    return authedFetch<PlanificacionDetalle>(`/planificaciones/${id}/archivar`, {
      method: "POST",
    })
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
