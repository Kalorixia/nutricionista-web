import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProgressReportDialog } from "@/components/modules/patients/ProgressReportDialog"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { localDateIso } from "@/utils/format"
import * as reporte_pdf from "@/utils/reporte_pdf"
import { REPORTE } from "./fixtures_progreso"

vi.mock("@/services/patients.service", () => ({
  patientsService: { obtenerProgreso: vi.fn(), obtenerReporte: vi.fn() },
}))

const obtener = vi.mocked(patientsService.obtenerReporte)

function renderDialog(onClose = vi.fn()) {
  render(<ProgressReportDialog idPaciente={65} onClose={onClose} />)
  return onClose
}

const desde = () => screen.getByLabelText("Desde") as HTMLInputElement
const hasta = () => screen.getByLabelText("Hasta") as HTMLInputElement
const poner = (campo: HTMLInputElement, valor: string) =>
  fireEvent.change(campo, { target: { value: valor } })
const descargar = () =>
  userEvent.click(screen.getByRole("button", { name: "Descargar" }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 15, 10) })
  obtener.mockReset()
  obtener.mockResolvedValue(REPORTE)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("ProgressReportDialog", () => {
  it("propone los últimos 30 días y no deja pasar de hoy", () => {
    renderDialog()
    expect(hasta().value).toBe("2026-11-15")
    expect(desde().value).toBe("2026-10-17")
    expect(hasta().max).toBe(localDateIso(new Date()))
  })

  it.each([
    [
      "2026-11-10",
      "2026-11-01",
      "La fecha desde no puede ser posterior a la fecha hasta",
    ],
    ["2026-11-01", "2026-11-16", "El período no puede incluir fechas futuras"],
    ["2025-11-14", "2026-11-15", "El período no puede superar los 366 días"],
    ["", "2026-11-15", "Elegí las dos fechas"],
  ])("valida %s a %s sin llamar al servicio", async (d, h, mensaje) => {
    renderDialog()
    poner(desde(), d)
    poner(hasta(), h)
    await descargar()
    expect((await screen.findByRole("alert")).textContent).toContain(mensaje)
    expect(obtener).not.toHaveBeenCalled()
  })

  it("366 días justos es válido", async () => {
    vi.spyOn(reporte_pdf, "descargar_reporte_pdf").mockResolvedValue()
    renderDialog()
    poner(desde(), "2025-11-15")
    await descargar()
    expect(obtener).toHaveBeenCalledWith(65, "2025-11-15", "2026-11-15")
  })

  it("descarga: pide el reporte con las fechas, arma el PDF y cierra", async () => {
    const pdf = vi
      .spyOn(reporte_pdf, "descargar_reporte_pdf")
      .mockResolvedValue()
    const onClose = renderDialog()
    poner(desde(), "2026-10-01")
    await descargar()
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(obtener).toHaveBeenCalledWith(65, "2026-10-01", "2026-11-15")
    expect(pdf).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_archivo: "reporte-ana-perez-2026-10-01-2026-11-15.pdf",
      })
    )
  })

  it("un 422 del servidor muestra su detail", async () => {
    obtener.mockRejectedValue(
      new ApiError("El período no puede superar los 366 días", 422)
    )
    renderDialog()
    await descargar()
    expect((await screen.findByRole("alert")).textContent).toContain(
      "El período no puede superar los 366 días"
    )
  })

  it("un 404 dice que el paciente ya no está vinculado", async () => {
    obtener.mockRejectedValue(new ApiError("Paciente no encontrado", 404))
    renderDialog()
    await descargar()
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Este paciente ya no está vinculado a tu perfil."
    )
  })

  it("si falla el PDF lo dice y no cierra", async () => {
    vi.spyOn(reporte_pdf, "descargar_reporte_pdf").mockRejectedValue(
      new Error("jspdf")
    )
    const onClose = renderDialog()
    await descargar()
    expect((await screen.findByRole("alert")).textContent).toContain(
      "No se pudo generar el PDF. Intentá de nuevo."
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
