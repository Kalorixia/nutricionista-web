import { apiFetch, authedFetch } from "@/services/http"
import type { EstadoMatriculaDetalle, Especialidad } from "@/types/auth"

interface CatalogosRegistroResponse {
  especialidades: Especialidad[]
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
}
