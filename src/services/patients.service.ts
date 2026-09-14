import { authedFetch } from "@/services/http"
import type {
  ActualizarPerfilInput,
  PerfilPaciente,
  PrescribirObjetivoInput,
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
  /** Perfil clínico completo de un paciente vinculado. */
  obtenerPerfil(idPaciente: number): Promise<PerfilPaciente> {
    return authedFetch<PerfilPaciente>(
      `/nutricionistas/me/pacientes/${idPaciente}/perfil`
    )
  },

  /** Corrige datos del perfil. Lo que no se envía no se toca. */
  actualizarPerfil(
    idPaciente: number,
    cambios: ActualizarPerfilInput
  ): Promise<PerfilPaciente> {
    return authedFetch<PerfilPaciente>(
      `/nutricionistas/me/pacientes/${idPaciente}/perfil`,
      { method: "PATCH", body: cambios }
    )
  },

  /**
   * Fija los objetivos nutricionales. Lo prescrito gana sobre el cálculo y
   * sobrevive a que el paciente cambie su peso. El cuerpo vacío lo borra.
   */
  prescribirObjetivo(
    idPaciente: number,
    objetivo: PrescribirObjetivoInput
  ): Promise<PerfilPaciente> {
    return authedFetch<PerfilPaciente>(
      `/nutricionistas/me/pacientes/${idPaciente}/objetivo`,
      { method: "PUT", body: objetivo }
    )
  },

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
