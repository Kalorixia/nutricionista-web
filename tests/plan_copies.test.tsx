import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Planning from "@/pages/Planning"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { GenerationsProvider } from "@/hooks/use-generations"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"
import type { CopiaPlan, PlanificacionDetalle } from "@/types/mealPlan"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    list: vi.fn(),
    templates: vi.fn(),
    duplicate: vi.fn(),
    saveAsTemplate: vi.fn(),
    remove: vi.fn(),
    parameters: vi.fn(),
    activeGenerations: vi.fn(),
    generationStatus: vi.fn(),
  },
}))
vi.mock("@/services/patients.service", () => ({
  patientsService: { listarPacientes: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const PLAN = {
  id_planificacion: 7,
  id_paciente: 3,
  nombre_paciente: "Ana Pérez",
  nombre: "Semana 1",
  descripcion: null,
  estado: "publicada" as const,
  fecha_inicio: null,
  fecha_fin: null,
  fecha_publicacion: null,
  created_at: "2026-10-01T10:00:00",
  cantidad_recetas: 20,
}

function copia(
  id: number,
  extra: Partial<PlanificacionDetalle> = {},
  quitados: CopiaPlan["quitados"] = []
): CopiaPlan {
  return {
    plan: {
      ...PLAN,
      id_planificacion: id,
      estado: "borrador",
      recetas: [],
      ...extra,
    },
    quitados,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.list).mockResolvedValue([PLAN])
  vi.mocked(mealPlansService.templates).mockResolvedValue([
    {
      id_planificacion: 30,
      nombre: "Base celíacos",
      descripcion: null,
      cantidad_recetas: 21,
      created_at: "2026-10-02T10:00:00",
    },
  ])
  vi.mocked(mealPlansService.activeGenerations).mockResolvedValue([])
  vi.mocked(patientsService.listarPacientes).mockResolvedValue({
    pacientes: [
      { id_paciente: 3, nombre: "Ana", apellido: "Pérez" },
      { id_paciente: 4, nombre: "Luis", apellido: "Gómez" },
    ],
  } as Awaited<ReturnType<typeof patientsService.listarPacientes>>)
})

function mount() {
  render(
    <MemoryRouter initialEntries={["/planificacion"]}>
      <GenerationsProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="/planificacion" element={<Planning />} />
            <Route path="/planificacion/:id" element={<p>Editor abierto</p>} />
          </Routes>
        </ConfirmProvider>
      </GenerationsProvider>
    </MemoryRouter>
  )
}

it("lista las plantillas propias aparte de los planes", async () => {
  mount()
  const seccion = await screen.findByRole("region", { name: "Mis plantillas" })
  expect(within(seccion).getByText("Base celíacos")).toBeTruthy()
  expect(within(seccion).getByText("21 ítems")).toBeTruthy()
})

it("duplica para otro paciente y muestra lo que se quitó con su motivo", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.duplicate).mockResolvedValue(
    copia(8, { id_paciente: 4 }, [
      {
        dia_semana: "Martes",
        momento_comida: "Cena",
        id_receta: 88,
        nombre: "Salmón al horno",
        motivo: "Pescado: contiene salmón",
      },
    ])
  )
  mount()
  await user.click(
    await screen.findByRole("button", { name: "Duplicar Semana 1" })
  )
  const dialogo = await screen.findByRole("dialog")
  expect(
    (within(dialogo).getByLabelText("Nombre") as HTMLInputElement).value
  ).toBe("Copia de Semana 1")
  expect(
    (within(dialogo).getByLabelText("Paciente") as HTMLInputElement).value
  ).toBe("3")
  await user.selectOptions(within(dialogo).getByLabelText("Paciente"), "4")
  await user.click(
    within(dialogo).getByRole("button", { name: "Crear borrador" })
  )

  expect(mealPlansService.duplicate).toHaveBeenCalledWith(7, {
    id_paciente: 4,
    nombre: "Copia de Semana 1",
  })
  const lista = await screen.findByRole("list", { name: "Comidas quitadas" })
  expect(within(lista).getByText("Salmón al horno")).toBeTruthy()
  expect(within(lista).getByText("Pescado: contiene salmón")).toBeTruthy()
  await user.click(screen.getByRole("button", { name: "Abrir el plan" }))
  expect(await screen.findByText("Editor abierto")).toBeTruthy()
})

it("sin nada quitado abre la copia directamente", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.duplicate).mockResolvedValue(copia(8))
  mount()
  await user.click(
    await screen.findByRole("button", { name: "Duplicar Semana 1" })
  )
  await user.click(screen.getByRole("button", { name: "Crear borrador" }))
  expect(await screen.findByText("Editor abierto")).toBeTruthy()
})

it("guarda un plan como plantilla con su nombre", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.saveAsTemplate).mockResolvedValue(
    copia(31, { id_paciente: null, es_plantilla: true })
  )
  mount()
  await user.click(
    await screen.findByRole("button", {
      name: "Guardar Semana 1 como plantilla",
    })
  )
  const dialogo = await screen.findByRole("dialog")
  expect(within(dialogo).queryByLabelText("Paciente")).toBeNull()
  const nombre = within(dialogo).getByLabelText("Nombre")
  await user.clear(nombre)
  await user.type(nombre, "Base 1800")
  await user.click(
    within(dialogo).getByRole("button", { name: "Guardar plantilla" })
  )
  expect(mealPlansService.saveAsTemplate).toHaveBeenCalledWith(7, "Base 1800")
  expect(await screen.findByText("Editor abierto")).toBeTruthy()
})

it("crea un plan desde una plantilla con el nombre de la plantilla", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.duplicate).mockResolvedValue(copia(9))
  mount()
  const seccion = await screen.findByRole("region", { name: "Mis plantillas" })
  await user.click(within(seccion).getByRole("button", { name: "Crear plan" }))
  const dialogo = await screen.findByRole("dialog")
  expect(
    (within(dialogo).getByLabelText("Nombre") as HTMLInputElement).value
  ).toBe("Base celíacos")
  await user.click(
    within(dialogo).getByRole("button", { name: "Crear borrador" })
  )
  expect(within(dialogo).getByRole("alert").textContent).toContain(
    "Elegí un paciente"
  )
  expect(mealPlansService.duplicate).not.toHaveBeenCalled()
  await user.selectOptions(within(dialogo).getByLabelText("Paciente"), "4")
  await user.click(
    within(dialogo).getByRole("button", { name: "Crear borrador" })
  )
  expect(mealPlansService.duplicate).toHaveBeenCalledWith(30, {
    id_paciente: 4,
    nombre: "Base celíacos",
  })
})
