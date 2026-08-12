import { apiFetch, authedFetch } from "@/services/http"
import type { EstadoMatriculaDetalle, Especialidad } from "@/types/auth"

interface CatalogosRegistroResponse {
  especialidades: Especialidad[]
}

export interface ActividadItem {
  id: string
  tipo: string
  mensaje: string
  fecha: string
}

interface ActividadRecienteResponse {
  eventos: ActividadItem[]
}

export const nutritionistService = {
  /** Público: usado por el formulario de alta, antes de tener sesión. */
  catalogosRegistro() {
    return apiFetch<CatalogosRegistroResponse>(
      "/nutricionistas/catalogos/registro"
    )
  },

  estadoMatricula() {
    return authedFetch<EstadoMatriculaDetalle>(
      "/nutricionistas/me/estado-matricula"
    )
  },

  async actividadReciente(limit = 10): Promise<ActividadItem[]> {
    const { eventos } = await authedFetch<ActividadRecienteResponse>(
      `/nutricionistas/me/actividad?limit=${limit}`
    )
    return eventos
  },
}
