import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { MeasurementsCard } from "@/components/modules/patients/MeasurementsCard"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { localDateIso } from "@/utils/format"
import type { Medicion } from "@/types/patient"

vi.mock("@/services/patients.service", () => ({
  patientsService: {
    registrarMedicion: vi.fn(),
    darDeBajaMedicion: vi.fn(),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

function medicion(
  id: number,
  fecha: string,
  extra: Partial<Medicion> = {}
): Medicion {
  return {
    id_medicion: id,
    peso_kg: 53,
    altura_cm: 163,
    fecha_medicion: fecha,
    created_at: `${fecha}T13:42:00Z`,
    cargada_por: "paciente",
    ...extra,
  }
}

// Del servidor: de la más antigua a la más reciente.
const HISTORIAL = [
  medicion(1, "2026-07-01", { cargada_por: null }),
  medicion(2, "2026-08-10", { peso_kg: null, cargada_por: "nutricionista" }),
  medicion(3, "2026-09-15", { peso_kg: 54.5 }),
]

function renderizar(
  props: Partial<Parameters<typeof MeasurementsCard>[0]> = {}
) {
  const onCambio = vi.fn()
  const onReintentar = vi.fn()
  render(
    <ConfirmProvider>
      <MeasurementsCard
        idPaciente={65}
        mediciones={HISTORIAL}
        error={null}
        pesoVigente={54.5}
        alturaVigente={163}
        onCambio={onCambio}
        onReintentar={onReintentar}
        {...props}
      />
    </ConfirmProvider>
  )
  return { onCambio, onReintentar }
}

function valor(etiqueta: string): string {
  return (screen.getByLabelText(etiqueta) as HTMLInputElement).value
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Tarjeta de mediciones", () => {
  it("lista la más reciente primero, con la vigente y quién la cargó", () => {
    renderizar()
    const tabla = screen.getByRole("table", { name: "Historial de mediciones" })
    const filas = within(tabla).getAllByRole("row").slice(1)
    expect(filas).toHaveLength(3)
    expect(filas[0].textContent).toContain("15/9/2026")
    expect(filas[0].textContent).toContain("Vigente")
    expect(filas[0].textContent).toContain("54.5 kg")
    expect(filas[0].textContent).toContain("Paciente")
    expect(filas[1].textContent).toContain("10/8/2026")
    expect(filas[1].textContent).toContain("—")
    expect(filas[1].textContent).toContain("Nutricionista")
    expect(filas[2].textContent).toContain("1/7/2026")
    expect(filas[2].textContent).toContain("Carga inicial")
    expect(screen.getAllByText("Vigente")).toHaveLength(1)
  })

  it("con una sola medición no ofrece la baja y explica cómo corregirla", () => {
    renderizar({ mediciones: [medicion(3, "2026-09-15")] })
    expect(screen.queryByRole("button", { name: /Dar de baja/ })).toBeNull()
    expect(screen.getByText(/Es la única medición/)).toBeTruthy()
  })

  it("registra una medición precargada con el vigente y la fecha de hoy", async () => {
    const user = userEvent.setup()
    vi.mocked(patientsService.registrarMedicion).mockResolvedValue(
      medicion(4, "2026-10-25")
    )
    const { onCambio } = renderizar()
    await user.click(screen.getByRole("button", { name: "Registrar medición" }))

    const hoy = localDateIso(new Date())
    expect(valor("Peso (kg)")).toBe("54.5")
    expect(valor("Altura (cm)")).toBe("163")
    expect(valor("Fecha")).toBe(hoy)

    await user.clear(screen.getByLabelText("Peso (kg)"))
    await user.type(screen.getByLabelText("Peso (kg)"), "70.5")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(patientsService.registrarMedicion).toHaveBeenCalledExactlyOnceWith(
      65,
      { peso_kg: 70.5, altura_cm: 163, fecha_medicion: hoy }
    )
    expect(toast.success).toHaveBeenCalledWith("Medición registrada")
    expect(onCambio).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole("form", { name: "Registrar medición" })
    ).toBeNull()
  })

  it.each([
    "Los datos producen una distribución nutricional inviable; revisá el perfil con el profesional",
    "Revisá los datos ingresados",
  ])(
    "muestra el rechazo del servidor y deja el formulario abierto: %s",
    async (mensaje) => {
      const user = userEvent.setup()
      vi.mocked(patientsService.registrarMedicion).mockRejectedValue(
        new ApiError(mensaje, 422)
      )
      const { onCambio } = renderizar()
      await user.click(
        screen.getByRole("button", { name: "Registrar medición" })
      )
      await user.click(screen.getByRole("button", { name: "Guardar" }))

      expect(toast.error).toHaveBeenCalledWith(mensaje)
      expect(onCambio).not.toHaveBeenCalled()
      expect(
        screen.getByRole("form", { name: "Registrar medición" })
      ).toBeTruthy()
      expect(valor("Peso (kg)")).toBe("54.5")
    }
  )

  it("da de baja una medición después de confirmar", async () => {
    const user = userEvent.setup()
    vi.mocked(patientsService.darDeBajaMedicion).mockResolvedValue(undefined)
    const { onCambio } = renderizar()
    await user.click(
      screen.getByRole("button", {
        name: "Dar de baja la medición del 15/9/2026",
      })
    )
    const dialogo = await screen.findByRole("alertdialog")
    expect(dialogo.textContent).toContain("La medición del 15/9/2026")
    await user.click(
      within(dialogo).getByRole("button", { name: "Dar de baja" })
    )

    expect(patientsService.darDeBajaMedicion).toHaveBeenCalledExactlyOnceWith(
      65,
      3
    )
    expect(toast.success).toHaveBeenCalledWith("Medición dada de baja")
    expect(onCambio).toHaveBeenCalledOnce()
  })

  it("cancelar la confirmación no da de baja nada", async () => {
    const user = userEvent.setup()
    const { onCambio } = renderizar()
    await user.click(
      screen.getByRole("button", {
        name: "Dar de baja la medición del 10/8/2026",
      })
    )
    const dialogo = await screen.findByRole("alertdialog")
    await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }))

    expect(patientsService.darDeBajaMedicion).not.toHaveBeenCalled()
    expect(onCambio).not.toHaveBeenCalled()
  })

  it.each([
    [
      409,
      "No se puede dar de baja la única medición activa del paciente",
      false,
    ],
    [404, "Paciente no encontrado", true],
  ])(
    "un %i en la baja muestra su texto",
    async (status, mensaje, resincroniza) => {
      const user = userEvent.setup()
      vi.mocked(patientsService.darDeBajaMedicion).mockRejectedValue(
        new ApiError(mensaje, status)
      )
      const { onCambio } = renderizar()
      await user.click(
        screen.getByRole("button", {
          name: "Dar de baja la medición del 15/9/2026",
        })
      )
      const dialogo = await screen.findByRole("alertdialog")
      await user.click(
        within(dialogo).getByRole("button", { name: "Dar de baja" })
      )

      expect(toast.error).toHaveBeenCalledWith(mensaje)
      expect(onCambio).toHaveBeenCalledTimes(resincroniza ? 1 : 0)
    }
  )

  it("con un error de carga ofrece reintentar", async () => {
    const user = userEvent.setup()
    const { onReintentar } = renderizar({
      mediciones: null,
      error: "Este paciente ya no está vinculado a tu perfil.",
    })
    const alerta = screen.getByRole("alert")
    expect(alerta.textContent).toContain(
      "Este paciente ya no está vinculado a tu perfil."
    )
    await user.click(within(alerta).getByRole("button", { name: "Reintentar" }))
    expect(onReintentar).toHaveBeenCalledOnce()
  })

  it("muestra las 10 más recientes y deja ver todas", async () => {
    const user = userEvent.setup()
    const muchas = Array.from({ length: 12 }, (_, i) =>
      medicion(i + 1, `2026-01-${String(i + 1).padStart(2, "0")}`)
    )
    renderizar({ mediciones: muchas })
    const tabla = screen.getByRole("table", { name: "Historial de mediciones" })
    expect(within(tabla).getAllByRole("row")).toHaveLength(11)
    const filas = within(tabla).getAllByRole("row").slice(1)
    expect(filas[0].textContent).toMatch(/^12\/1\/2026/)
    expect(filas[9].textContent).toMatch(/^3\/1\/2026/)

    await user.click(
      screen.getByRole("button", { name: "Ver las 12 mediciones" })
    )
    expect(within(tabla).getAllByRole("row")).toHaveLength(13)
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeTruthy()
  })
})
