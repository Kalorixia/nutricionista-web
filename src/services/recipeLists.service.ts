import { authedFetch } from "@/services/http"
import type { ListaReceta, ListaRecetaDetalle } from "@/types/recipe"

interface ListaListasResponse {
  listas: ListaReceta[]
}

export const recipeListsService = {
  async list(): Promise<ListaReceta[]> {
    const { listas } = await authedFetch<ListaListasResponse>("/listas")
    return listas
  },

  async create(nombre: string): Promise<ListaReceta> {
    return authedFetch<ListaReceta>("/listas", {
      method: "POST",
      body: { nombre },
    })
  },

  async get(id: number): Promise<ListaRecetaDetalle> {
    return authedFetch<ListaRecetaDetalle>(`/listas/${id}`)
  },

  async remove(id: number): Promise<void> {
    await authedFetch(`/listas/${id}`, { method: "DELETE" })
  },

  async addRecipe(idLista: number, idReceta: number): Promise<void> {
    await authedFetch(`/listas/${idLista}/recetas/${idReceta}`, {
      method: "POST",
    })
  },

  async removeRecipe(idLista: number, idReceta: number): Promise<void> {
    await authedFetch(`/listas/${idLista}/recetas/${idReceta}`, {
      method: "DELETE",
    })
  },
}
