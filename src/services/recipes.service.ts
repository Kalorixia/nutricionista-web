import { authedFetch } from "@/services/http"
import type {
  Categoria,
  ListaRecetasResponse,
  RecetaDetalle,
  RecetaListItem,
  TipoReceta,
} from "@/types/recipe"

interface ListaCategoriasResponse {
  categorias: Categoria[]
}

export const recipesService = {
  /**
   * Sin `limit`, devuelve el catálogo completo sin paginar (para selectores
   * que necesitan todas las recetas, ej. el picker de planificación). Los
   * listados navegables deben pasar `limit`/`offset`.
   */
  async list(
    params: {
      q?: string
      limit?: number
      offset?: number
      tipo?: TipoReceta
    } = {}
  ): Promise<ListaRecetasResponse> {
    const search = new URLSearchParams()
    if (params.q) search.set("q", params.q)
    if (params.tipo) search.set("tipo", params.tipo)
    if (params.limit) search.set("limit", String(params.limit))
    if (params.offset) search.set("offset", String(params.offset))
    const qs = search.toString() ? `?${search.toString()}` : ""
    return authedFetch<ListaRecetasResponse>(`/recetas${qs}`)
  },

  async get(id: number): Promise<RecetaDetalle> {
    return authedFetch<RecetaDetalle>(`/recetas/${id}`)
  },

  async listCategorias(): Promise<Categoria[]> {
    const { categorias } = await authedFetch<ListaCategoriasResponse>(
      "/recetas/categorias"
    )
    return categorias
  },

  async byIds(ids: number[]): Promise<RecetaListItem[]> {
    const { recetas } = await this.list()
    return recetas.filter((r) => ids.includes(r.id_receta))
  },
}
