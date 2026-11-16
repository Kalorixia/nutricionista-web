import { beforeEach, describe, expect, it, vi } from "vitest"
import { authedFetch } from "@/services/http"
import { patientsService } from "@/services/patients.service"

vi.mock("@/services/http", () => ({ authedFetch: vi.fn() }))

beforeEach(() => vi.mocked(authedFetch).mockReset())

describe("progreso del paciente en patientsService", () => {
  it("pide el historial con limit y offset y no desenvuelve la respuesta", async () => {
    const respuesta = { total: 9, limit: 4, offset: 0, semanas: [] }
    vi.mocked(authedFetch).mockResolvedValue(respuesta)
    expect(
      await patientsService.obtenerProgreso(65, { limit: 4, offset: 0 })
    ).toBe(respuesta)
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/progreso?limit=4&offset=0"
    )
  })

  it("pide el reporte con el período", async () => {
    const respuesta = { sin_registros: true }
    vi.mocked(authedFetch).mockResolvedValue(respuesta)
    expect(
      await patientsService.obtenerReporte(65, "2026-10-01", "2026-11-15")
    ).toBe(respuesta)
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/progreso/reporte?desde=2026-10-01&hasta=2026-11-15"
    )
  })
})
