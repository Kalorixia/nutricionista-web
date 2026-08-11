import { authedFetch } from "@/services/http"
import type {
  CodigoVinculacion,
  EstadoCodigo,
  PacienteDetalle,
  PacienteVinculado,
} from "@/types/patient"

interface ListaCodigosResponse {
  codigos: CodigoVinculacion[]
}

interface ListaPacientesResponse {
  pacientes: PacienteVinculado[]
  total: number
  limit: number
  offset: number
}

export const patientsService = {
  generarCodigo(): Promise<CodigoVinculacion> {
    return authedFetch<CodigoVinculacion>(
      "/nutricionistas/me/codigos-vinculacion",
      { method: "POST" }
    )
  },

  async listarCodigos(estado?: EstadoCodigo): Promise<CodigoVinculacion[]> {
    const query = estado ? `?estado=${estado}` : ""
    const { codigos } = await authedFetch<ListaCodigosResponse>(
      `/nutricionistas/me/codigos-vinculacion${query}`
    )
    return codigos
  },

  revocarCodigo(idCodigo: number): Promise<void> {
    return authedFetch(`/nutricionistas/me/codigos-vinculacion/${idCodigo}`, {
      method: "DELETE",
    })
  },

  async listarPacientes(
    params: { q?: string; limit?: number; offset?: number } = {}
  ): Promise<{ pacientes: PacienteVinculado[]; total: number }> {
    const search = new URLSearchParams()
    if (params.q) search.set("q", params.q)
    if (params.limit) search.set("limit", String(params.limit))
    if (params.offset) search.set("offset", String(params.offset))
    const query = search.toString() ? `?${search.toString()}` : ""
    const { pacientes, total } = await authedFetch<ListaPacientesResponse>(
      `/nutricionistas/me/pacientes${query}`
    )
    return { pacientes, total }
  },

  obtenerPaciente(idPaciente: number): Promise<PacienteDetalle> {
    return authedFetch<PacienteDetalle>(
      `/nutricionistas/me/pacientes/${idPaciente}`
    )
  },

  desvincularPaciente(idPaciente: number): Promise<void> {
    return authedFetch(`/nutricionistas/me/pacientes/${idPaciente}`, {
      method: "DELETE",
    })
  },
}
