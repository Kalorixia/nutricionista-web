import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UserEvent } from "@testing-library/user-event"
import { toast } from "sonner"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Planning from "@/pages/Planning"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { GenerationsProvider } from "@/hooks/use-generations"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    list: vi.fn(),
    create: vi.fn(),
    generate: vi.fn(),
    remove: vi.fn(),
    archive: vi.fn(),
    activeGenerations: vi.fn(),
    generationStatus: vi.fn(),
  },
}))
vi.mock("@/services/patients.service", () => ({
  patientsService: { listarPacientes: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.list).mockResolvedValue([])
  vi.mocked(mealPlansService.activeGenerations).mockResolvedValue([])
  vi.mocked(patientsService.listarPacientes).mockResolvedValue({
    pacientes: [{ id_paciente: 3, nombre: "Ana", apellido: "Pérez" }],
  } as Awaited<ReturnType<typeof patientsService.listarPacientes>>)
})

function mount() {
  render(
    <MemoryRouter initialEntries={["/planificacion"]}>
      <GenerationsProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="/planificacion" element={<Planning />} />
            <Route
              path="/planificacion/:id"
              element={<p>Editor del borrador</p>}
            />
          </Routes>
        </ConfirmProvider>
      </GenerationsProvider>
    </MemoryRouter>
  )
}

async function fillAndSubmit(user: UserEvent, label: string) {
  await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
  await user.selectOptions(screen.getByLabelText("Paciente"), "3")
  await user.type(screen.getByLabelText("Nombre del plan"), "Semana")
  await user.click(screen.getByRole("button", { name: label }))
}

it("abre el borrador al crearlo a mano", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.create).mockResolvedValue({
    id_planificacion: 7,
  } as Awaited<ReturnType<typeof mealPlansService.create>>)
  mount()
  await fillAndSubmit(user, "Crear manual")
  await screen.findByText("Editor del borrador")
  expect(mealPlansService.create).toHaveBeenCalledWith(
    expect.objectContaining({ id_paciente: 3, nombre: "Semana" })
  )
})

it("con el Copiloto no espera: deja seguir trabajando y avisa después", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.generate).mockResolvedValue({
    id_generacion: 12,
    id_paciente: 3,
    estado: "pendiente",
    id_planificacion: null,
    nombre: "Semana",
    error_codigo: null,
    error_mensaje: null,
    created_at: "2026-09-12T12:00:00Z",
    updated_at: "2026-09-12T12:00:00Z",
  })
  mount()
  await fillAndSubmit(user, "Generar con Copiloto")

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Lo estoy generando. Te aviso cuando esté listo."
    )
  )
  // No navega al editor: todavía no hay borrador que abrir.
  expect(screen.queryByText("Editor del borrador")).toBeNull()
  expect(mealPlansService.generate).toHaveBeenCalledWith(
    expect.objectContaining({ id_paciente: 3, nombre: "Semana" })
  )
})

it("distingue el error de listado de una lista vacía y permite reintentar", async () => {
  vi.mocked(mealPlansService.list).mockRejectedValueOnce(
    new Error("Sin conexión")
  )
  const user = userEvent.setup()
  mount()
  await screen.findByText("Sin conexión")
  expect(screen.queryByText("Todavía no creaste ningún plan.")).toBeNull()
  await user.click(screen.getByRole("button", { name: "Reintentar" }))
  await screen.findByText("Todavía no creaste ningún plan.")
})

it("exige confirmación al eliminar y conserva el plan si falla", async () => {
  vi.mocked(mealPlansService.list).mockResolvedValue([
    {
      id_planificacion: 7,
      nombre: "Plan de prueba",
      nombre_paciente: "Ana",
      cantidad_recetas: 2,
      estado: "borrador",
    },
  ] as Awaited<ReturnType<typeof mealPlansService.list>>)
  vi.mocked(mealPlansService.remove).mockRejectedValue(
    new Error("Sin conexión")
  )
  const user = userEvent.setup()
  mount()
  await user.click(await screen.findByRole("button", { name: "Eliminar" }))
  expect(mealPlansService.remove).not.toHaveBeenCalled()
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Eliminar",
    })
  )
  await waitFor(() => expect(mealPlansService.remove).toHaveBeenCalledOnce())
  expect(screen.getByText("Plan de prueba")).toBeTruthy()
})
