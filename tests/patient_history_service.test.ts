import { beforeEach, describe, expect, it, vi } from "vitest"
import { authedFetch } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { formatDateOnly, localDateIso } from "@/utils/format"

vi.mock("@/services/http", () => ({ authedFetch: vi.fn() }))

const medicion = {
  id_medicion: 31,
  peso_kg: 72.4,
  altura_cm: 168,
  fecha_medicion: "2026-09-15",
  created_at: "2026-09-15T13:42:00Z",
  cargada_por: "paciente" as const,
}

beforeEach(() => vi.mocked(authedFetch).mockReset())

describe("historial del paciente en patientsService", () => {
  it("lista las mediciones desenvueltas", async () => {
    vi.mocked(authedFetch).mockResolvedValue({ mediciones: [medicion] })
    expect(await patientsService.listarMediciones(65)).toEqual([medicion])
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/mediciones"
    )
  })

  it("lista los requerimientos desenvueltos", async () => {
    const requerimiento = { id_requerimiento: 8 }
    vi.mocked(authedFetch).mockResolvedValue({
      requerimientos: [requerimiento],
    })
    expect(await patientsService.listarRequerimientos(65)).toEqual([
      requerimiento,
    ])
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/requerimientos"
    )
  })

  it("registra una medición con peso, altura y fecha", async () => {
    vi.mocked(authedFetch).mockResolvedValue(medicion)
    const input = {
      peso_kg: 72.4,
      altura_cm: 168,
      fecha_medicion: "2026-09-15",
    }
    expect(await patientsService.registrarMedicion(65, input)).toEqual(medicion)
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/mediciones",
      { method: "POST", body: input }
    )
    const [, opciones] = vi.mocked(authedFetch).mock.calls[0]
    expect(Object.keys(opciones?.body as object).sort()).toEqual([
      "altura_cm",
      "fecha_medicion",
      "peso_kg",
    ])
  })

  it("da de baja una medición", async () => {
    vi.mocked(authedFetch).mockResolvedValue(undefined)
    await patientsService.darDeBajaMedicion(65, 31)
    expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
      "/nutricionistas/me/pacientes/65/mediciones/31",
      { method: "DELETE" }
    )
  })
})

describe("fechas sin hora", () => {
  it("muestra la fecha de la medición sin correr de día", () => {
    expect(formatDateOnly("2026-09-15")).toBe("15/9/2026")
  })

  it("arma la fecha local, no la UTC", () => {
    expect(localDateIso(new Date(2026, 9, 25, 23, 30))).toBe("2026-10-25")
    expect(localDateIso(new Date(2026, 0, 5, 0, 10))).toBe("2026-01-05")
  })
})
