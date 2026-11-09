import { beforeEach, expect, it, vi } from "vitest"
import { authedFetch } from "@/services/http"
import { patientsService } from "@/services/patients.service"

vi.mock("@/services/http", () => ({ authedFetch: vi.fn() }))

beforeEach(() => {
  vi.mocked(authedFetch).mockReset()
})

it("listarObservaciones pide el historial y devuelve el arreglo desenvuelto", async () => {
  const observaciones = [
    {
      id_observacion: 12,
      texto: "Nota ficticia",
      created_at: "2026-03-10T15:30:00Z",
      autor_nombre: "Ana",
      autor_apellido: "Prueba",
      es_propia: true,
    },
  ]
  vi.mocked(authedFetch).mockResolvedValue({ observaciones })

  expect(await patientsService.listarObservaciones(65)).toEqual(observaciones)
  expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
    "/nutricionistas/me/pacientes/65/observaciones"
  )
})

it("crearObservacion envía solo el texto, sin recortar", async () => {
  const creada = { id_observacion: 13, texto: "  Nota  ", es_propia: true }
  vi.mocked(authedFetch).mockResolvedValue(creada)

  expect(
    await patientsService.crearObservacion(65, { texto: "  Nota  " })
  ).toEqual(creada)
  expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
    "/nutricionistas/me/pacientes/65/observaciones",
    { method: "POST", body: { texto: "  Nota  " } }
  )
})

it("darDeBajaObservacion llama DELETE sobre la observación", async () => {
  vi.mocked(authedFetch).mockResolvedValue(undefined)

  await patientsService.darDeBajaObservacion(65, 12)
  expect(authedFetch).toHaveBeenCalledExactlyOnceWith(
    "/nutricionistas/me/pacientes/65/observaciones/12",
    { method: "DELETE" }
  )
})
