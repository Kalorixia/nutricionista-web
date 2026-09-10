import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Planning from "@/pages/Planning"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    list: vi.fn(),
    create: vi.fn(),
    generate: vi.fn(),
    remove: vi.fn(),
    archive: vi.fn(),
  },
}))
vi.mock("@/services/patients.service", () => ({
  patientsService: { listarPacientes: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.list).mockResolvedValue([])
  vi.mocked(patientsService.listarPacientes).mockResolvedValue({
    pacientes: [{ id_paciente: 3, nombre: "Ana", apellido: "Pérez" }],
  } as Awaited<ReturnType<typeof patientsService.listarPacientes>>)
})

function mount() {
  render(
    <MemoryRouter initialEntries={["/planificacion"]}>
      <ConfirmProvider>
        <Routes>
          <Route path="/planificacion" element={<Planning />} />
          <Route
            path="/planificacion/:id"
            element={<p>Editor del borrador</p>}
          />
        </Routes>
      </ConfirmProvider>
    </MemoryRouter>
  )
}

it.each([false, true])(
  "abre el borrador devuelto al crear (Copiloto=%s)",
  async (with_ai) => {
    const user = userEvent.setup()
    const method = with_ai ? mealPlansService.generate : mealPlansService.create
    vi.mocked(method).mockResolvedValue({ id_planificacion: 7 } as Awaited<
      ReturnType<typeof method>
    >)
    mount()
    await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
    await user.selectOptions(screen.getByLabelText("Paciente"), "3")
    await user.type(screen.getByLabelText("Nombre del plan"), "Semana")
    await user.click(
      screen.getByRole("button", {
        name: with_ai ? "Generar con Copiloto" : "Crear manual",
      })
    )
    await screen.findByText("Editor del borrador")
    expect(method).toHaveBeenCalledWith(
      expect.objectContaining({ id_paciente: 3, nombre: "Semana" })
    )
  }
)

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
