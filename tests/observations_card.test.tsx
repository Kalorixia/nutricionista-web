import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { ObservationsCard } from "@/components/modules/patients/ObservationsCard"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { patientsService } from "@/services/patients.service"
import { ApiError } from "@/services/http"
import { formatDateTime } from "@/utils/format"
import type { Observacion } from "@/types/patient"

vi.mock("@/services/patients.service", () => ({
  patientsService: {
    listarObservaciones: vi.fn(),
    crearObservacion: vi.fn(),
    darDeBajaObservacion: vi.fn(),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const AJENA: Observacion = {
  id_observacion: 1,
  texto: "Evolución ficticia anterior",
  created_at: "2026-03-01T12:00:00Z",
  autor_nombre: "Bruno",
  autor_apellido: "Anterior",
  es_propia: false,
}
const PROPIA: Observacion = {
  id_observacion: 2,
  texto: "Primera línea ficticia\nSegunda línea ficticia",
  created_at: "2026-03-10T15:30:00Z",
  autor_nombre: "Ana",
  autor_apellido: "Prueba",
  es_propia: true,
}

function renderCard() {
  return render(
    <ConfirmProvider>
      <ObservationsCard idPaciente={65} />
    </ConfirmProvider>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(patientsService.listarObservaciones).mockResolvedValue([
    AJENA,
    PROPIA,
  ])
})

describe("ObservationsCard", () => {
  it("lista la más reciente primero, con autor, fecha y baja solo en las propias", async () => {
    renderCard()
    const lista = await screen.findByRole("list", {
      name: "Historial de observaciones",
    })
    const items = within(lista).getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain("Ana Prueba")
    expect(items[0].textContent).toContain(formatDateTime(PROPIA.created_at))
    expect(items[0].textContent).toContain("Tuya")
    expect(items[0].querySelector("p")?.textContent).toBe(PROPIA.texto)
    expect(
      within(items[0]).getByRole("button", {
        name: `Dar de baja la observación del ${formatDateTime(PROPIA.created_at)}`,
      })
    ).toBeTruthy()
    expect(items[1].textContent).toContain("Bruno Anterior")
    expect(items[1].textContent).not.toContain("Tuya")
    expect(within(items[1]).queryByRole("button")).toBeNull()
  })

  it("muestra el estado vacío", async () => {
    vi.mocked(patientsService.listarObservaciones).mockResolvedValue([])
    renderCard()
    expect(
      await screen.findByText("Todavía no hay observaciones.")
    ).toBeTruthy()
  })

  it("un 404 al listar informa la desvinculación y Reintentar vuelve a pedir", async () => {
    vi.mocked(patientsService.listarObservaciones).mockRejectedValueOnce(
      new ApiError("Paciente no encontrado", 404)
    )
    renderCard()
    expect(
      await screen.findByText("Este paciente ya no está vinculado a tu perfil.")
    ).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(await screen.findByText("Ana Prueba")).toBeTruthy()
    expect(patientsService.listarObservaciones).toHaveBeenCalledTimes(2)
  })

  it("con el servicio sin mockear muestra el error y no explota", async () => {
    const original = patientsService.listarObservaciones
    Reflect.deleteProperty(patientsService, "listarObservaciones")
    renderCard()
    try {
      expect(await screen.findByRole("alert")).toBeTruthy()
    } finally {
      patientsService.listarObservaciones = original
    }
  })

  it("agrega una observación: queda primera, con Tuya, y cierra el formulario", async () => {
    const nueva: Observacion = {
      ...PROPIA,
      id_observacion: 3,
      texto: "Nota nueva ficticia",
      created_at: "2026-03-11T10:00:00Z",
    }
    vi.mocked(patientsService.crearObservacion).mockResolvedValue(nueva)
    renderCard()
    await screen.findByText("Ana Prueba")
    await userEvent.click(
      screen.getByRole("button", { name: /Agregar observación/ })
    )
    await userEvent.type(
      screen.getByLabelText("Nueva observación"),
      "Nota nueva ficticia"
    )
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }))
    await waitFor(() =>
      expect(patientsService.crearObservacion).toHaveBeenCalledWith(65, {
        texto: "Nota nueva ficticia",
      })
    )
    expect(toast.success).toHaveBeenCalledWith("Observación registrada")
    const items = await screen.findAllByRole("listitem")
    expect(items[0].textContent).toContain("Nota nueva ficticia")
    expect(items[0].textContent).toContain("Tuya")
    expect(screen.queryByLabelText("Nueva observación")).toBeNull()
  })

  it("un 422 muestra el mensaje y deja el formulario abierto con lo escrito", async () => {
    vi.mocked(patientsService.crearObservacion).mockRejectedValue(
      new ApiError("La observación no puede estar vacía", 422)
    )
    renderCard()
    await screen.findByText("Ana Prueba")
    await userEvent.click(
      screen.getByRole("button", { name: /Agregar observación/ })
    )
    await userEvent.type(screen.getByLabelText("Nueva observación"), "   ")
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "La observación no puede estar vacía"
      )
    )
    expect(
      (screen.getByLabelText("Nueva observación") as HTMLTextAreaElement).value
    ).toBe("   ")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })

  it("un 404 al crear recarga la lista", async () => {
    vi.mocked(patientsService.crearObservacion).mockRejectedValue(
      new ApiError("Paciente no encontrado", 404)
    )
    renderCard()
    await screen.findByText("Ana Prueba")
    await userEvent.click(
      screen.getByRole("button", { name: /Agregar observación/ })
    )
    await userEvent.type(screen.getByLabelText("Nueva observación"), "Algo")
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Paciente no encontrado")
    )
    await waitFor(() =>
      expect(patientsService.listarObservaciones).toHaveBeenCalledTimes(2)
    )
  })

  const botonBaja = () =>
    screen.findByRole("button", {
      name: `Dar de baja la observación del ${formatDateTime(PROPIA.created_at)}`,
    })

  it("la baja confirmada la saca de la lista", async () => {
    vi.mocked(patientsService.darDeBajaObservacion).mockResolvedValue(undefined)
    renderCard()
    await userEvent.click(await botonBaja())
    expect(await screen.findByText("¿Dar de baja la observación?")).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Dar de baja" }))
    await waitFor(() =>
      expect(patientsService.darDeBajaObservacion).toHaveBeenCalledWith(65, 2)
    )
    expect(toast.success).toHaveBeenCalledWith("Observación dada de baja")
    await waitFor(() => expect(screen.queryByText("Ana Prueba")).toBeNull())
  })

  it("cancelar la baja no llama al servicio", async () => {
    renderCard()
    await userEvent.click(await botonBaja())
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancelar" })
    )
    expect(patientsService.darDeBajaObservacion).not.toHaveBeenCalled()
    expect(screen.getByText("Ana Prueba")).toBeTruthy()
  })

  it("no deja guardar hasta que termine la recarga, para que no pise el alta", async () => {
    vi.mocked(patientsService.darDeBajaObservacion).mockRejectedValue(
      new ApiError("Observación no encontrada", 404)
    )
    renderCard()
    const boton = await botonBaja()
    let resolver: (lista: Observacion[]) => void = () => {}
    vi.mocked(patientsService.listarObservaciones).mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      })
    )
    await userEvent.click(boton)
    await userEvent.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    )
    await waitFor(() =>
      expect(patientsService.listarObservaciones).toHaveBeenCalledTimes(2)
    )
    await userEvent.click(
      screen.getByRole("button", { name: /Agregar observación/ })
    )
    const guardar = () =>
      screen.getByRole<HTMLButtonElement>("button", { name: /Guardar/ })
    expect(guardar().disabled).toBe(true)

    resolver([AJENA])
    await waitFor(() => expect(guardar().disabled).toBe(false))
  })

  it("un 403 en la baja muestra el mensaje y recarga la lista", async () => {
    vi.mocked(patientsService.darDeBajaObservacion).mockRejectedValue(
      new ApiError("Solo el autor puede dar de baja la observación", 403)
    )
    renderCard()
    await userEvent.click(await botonBaja())
    await userEvent.click(
      await screen.findByRole("button", { name: "Dar de baja" })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Solo el autor puede dar de baja la observación"
      )
    )
    await waitFor(() =>
      expect(patientsService.listarObservaciones).toHaveBeenCalledTimes(2)
    )
  })

  it("con 12 observaciones muestra 10 y Ver las 12 muestra todas", async () => {
    const muchas = Array.from({ length: 12 }, (_, i) => ({
      ...AJENA,
      id_observacion: 100 + i,
      texto: `Nota ficticia ${i}`,
      created_at: `2026-02-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
    }))
    vi.mocked(patientsService.listarObservaciones).mockResolvedValue(muchas)
    renderCard()
    await screen.findByText("Nota ficticia 11")
    expect(screen.getAllByRole("listitem")).toHaveLength(10)
    await userEvent.click(
      screen.getByRole("button", { name: "Ver las 12 observaciones" })
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(12)
  })
})
