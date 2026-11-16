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

export interface FotoPerfilResponse {
  foto_url: string
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

  /** Sube o reemplaza la foto de perfil propia (multipart, campo `foto`). */
  subirFoto(file: File) {
    const body = new FormData()
    body.append("foto", file)
    return authedFetch<FotoPerfilResponse>("/nutricionistas/me/foto", {
      method: "POST",
      body,
    })
  },

  /** Quita la foto de perfil propia (204 aunque no hubiera). */
  async quitarFoto(): Promise<void> {
    await authedFetch<void>("/nutricionistas/me/foto", { method: "DELETE" })
  },

  async actividadReciente(limit = 10): Promise<ActividadItem[]> {
    const { eventos } = await authedFetch<ActividadRecienteResponse>(
      `/nutricionistas/me/actividad?limit=${limit}`
    )
    return eventos
  },
}
