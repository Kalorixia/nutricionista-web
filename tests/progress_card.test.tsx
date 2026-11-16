import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { ProgressCard } from "@/components/modules/patients/ProgressCard"
import { ApiError } from "@/services/http"
import { patientsService } from "@/services/patients.service"
import { puntos_peso } from "@/utils/progreso"
import type { HistorialProgreso } from "@/types/progreso"
import { HISTORIAL } from "./fixtures_progreso"

vi.mock("@/services/patients.service", () => ({
  patientsService: { obtenerProgreso: vi.fn(), obtenerReporte: vi.fn() },
}))

const obtener = vi.mocked(patientsService.obtenerProgreso)

function renderCard(version = 0, propios = [12]) {
  const vista = (v: number) => (
    <MemoryRouter>
      <ProgressCard idPaciente={65} idsPlanesPropios={propios} version={v} />
    </MemoryRouter>
  )
  const resultado = render(vista(version))
  return { ...resultado, cambiar: (v: number) => resultado.rerender(vista(v)) }
}

beforeEach(() => {
  obtener.mockReset()
  obtener.mockResolvedValue(HISTORIAL)
})

describe("ProgressCard", () => {
  it("muestra las semanas con porcentaje, desglose y lo que preparó", async () => {
    renderCard()
    const semana = await screen.findByRole("region", {
      name: "Semana del 9/11",
    })
    expect(within(semana).getByText("9/11 – 15/11")).toBeTruthy()
    expect(within(semana).getAllByText("50%")[0]).toBeTruthy()
    expect(within(semana).getByText(/Avena con frutas ×3/)).toBeTruthy()
    expect(obtener).toHaveBeenCalledWith(65, { limit: 4, offset: 0 })
  })

  it("una comida con cambios muestra su comentario y no cuenta como preparada", async () => {
    renderCard()
    const semana = await screen.findByRole("region", {
      name: "Semana del 9/11",
    })
    expect(within(semana).getByText(/Cambié el arroz por papa/)).toBeTruthy()
    expect(within(semana).getByText(/comió Lentejas guisadas/)).toBeTruthy()
    expect(within(semana).queryByText(/preparó Lentejas/)).toBeNull()
    expect(within(semana).getByText(/preparó Avena con frutas/)).toBeTruthy()
    // La semana cruza dos planes: se ve el plan de cada comida y por plan.
    expect(within(semana).getByLabelText("Por plan")).toBeTruthy()
    expect(within(semana).getByText(/Almuerzo \(Plan noviembre\)/)).toBeTruthy()
  })

  it("enlaza solo los planes propios y muestra el nutricionista de cada uno", async () => {
    renderCard()
    const planes = await screen.findByLabelText("Planes del progreso")
    expect(
      within(planes)
        .getByRole("link", { name: "Plan noviembre" })
        .getAttribute("href")
    ).toBe("/planificacion/12")
    expect(
      within(planes).queryByRole("link", { name: "Plan octubre" })
    ).toBeNull()
    expect(within(planes).getByText(/Luis Ríos/)).toBeTruthy()
    expect(within(planes).getByText(/Ana Gómez/)).toBeTruthy()
  })

  it("Ver semanas anteriores pide el offset siguiente, agrega y se oculta al llegar al total", async () => {
    const segunda: HistorialProgreso = {
      ...HISTORIAL,
      offset: 4,
      semanas: [
        { ...HISTORIAL.semanas[1], inicio: "2026-10-19", fin: "2026-10-25" },
      ],
    }
    obtener.mockResolvedValueOnce(HISTORIAL).mockResolvedValueOnce(segunda)
    renderCard()
    await screen.findByRole("region", { name: "Semana del 9/11" })
    await userEvent.click(
      screen.getByRole("button", { name: /Ver semanas anteriores/ })
    )
    await screen.findByRole("region", { name: "Semana del 19/10" })
    expect(obtener).toHaveBeenLastCalledWith(65, { limit: 4, offset: 4 })
    expect(screen.getByRole("region", { name: "Semana del 9/11" })).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: /Ver semanas anteriores/ })
    ).toBeNull()
  })

  it("si falla Ver semanas anteriores conserva lo cargado y muestra el error", async () => {
    obtener
      .mockResolvedValueOnce(HISTORIAL)
      .mockRejectedValueOnce(new ApiError("Servicio caído", 500))
    renderCard()
    await screen.findByRole("region", { name: "Semana del 9/11" })
    await userEvent.click(
      screen.getByRole("button", { name: /Ver semanas anteriores/ })
    )
    expect(await screen.findByText("Servicio caído")).toBeTruthy()
    expect(screen.getByRole("region", { name: "Semana del 9/11" })).toBeTruthy()
  })

  it("sin planes publicados muestra el vacío y el objetivo", async () => {
    obtener.mockResolvedValue({
      ...HISTORIAL,
      total: 0,
      planes: [],
      semanas: [],
      mediciones: [],
    })
    renderCard()
    expect(
      await screen.findByText(/el paciente no tiene planes publicados/)
    ).toBeTruthy()
    expect(screen.getByText("Bajar de peso")).toBeTruthy()
    expect(screen.getByText("Sin mediciones")).toBeTruthy()
  })

  it("un 404 dice que está desvinculado y Reintentar vuelve a pedir", async () => {
    obtener.mockRejectedValueOnce(new ApiError("Paciente no encontrado", 404))
    renderCard()
    const alerta = await screen.findByRole("alert")
    expect(alerta.textContent).toContain(
      "Este paciente ya no está vinculado a tu perfil."
    )
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    await screen.findByRole("region", { name: "Semana del 9/11" })
    expect(obtener).toHaveBeenCalledTimes(2)
  })

  it("cambiar la versión vuelve a la primera página", async () => {
    const { cambiar } = renderCard(0)
    await screen.findByRole("region", { name: "Semana del 9/11" })
    cambiar(1)
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(2))
    expect(obtener).toHaveBeenLastCalledWith(65, { limit: 4, offset: 0 })
  })

  it("el peso muestra primera, última, diferencia, objetivo y el gráfico", async () => {
    renderCard()
    expect(await screen.findByText(/74,0 kg/)).toBeTruthy()
    expect(screen.getByText("-3,1 kg")).toBeTruthy()
    expect(screen.getByText("Bajar de peso")).toBeTruthy()
    expect(
      screen.getByRole("img", { name: /de 74,0 kg a 70,9 kg/ })
    ).toBeTruthy()
  })

  it("el botón del reporte está aunque el historial falle", async () => {
    obtener.mockRejectedValue(new ApiError("Servicio caído", 500))
    renderCard()
    await screen.findByRole("alert")
    expect(
      screen.getByRole("button", { name: /Descargar reporte/ })
    ).toBeTruthy()
  })
})

describe("puntos_peso", () => {
  it("escala los pesos al área y deja el más alto arriba", () => {
    const puntos = puntos_peso(
      [{ peso_kg: 80 }, { peso_kg: null }, { peso_kg: 70 }, { peso_kg: 75 }],
      104,
      44,
      4
    )
    expect(puntos).toEqual([
      { x: 4, y: 4 },
      { x: 52, y: 40 },
      { x: 100, y: 22 },
    ])
  })

  it("con peso constante va al medio y sin pesos no hay puntos", () => {
    expect(puntos_peso([{ peso_kg: 70 }, { peso_kg: 70 }], 100, 40)).toEqual([
      { x: 4, y: 20 },
      { x: 96, y: 20 },
    ])
    expect(puntos_peso([{ peso_kg: null }], 100, 40)).toEqual([])
  })
})
