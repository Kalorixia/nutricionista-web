import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Planning from "@/pages/Planning"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { GenerationsProvider } from "@/hooks/use-generations"
import { mealPlansService } from "@/services/mealPlans.service"
import { patientsService } from "@/services/patients.service"
import { agrupar_por_paciente, iniciales } from "@/utils/planes"
import type { Planificacion } from "@/types/mealPlan"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    list: vi.fn(),
    templates: vi.fn(),
    parameters: vi.fn(),
    activeGenerations: vi.fn(),
    generationStatus: vi.fn(),
  },
}))
vi.mock("@/services/patients.service", () => ({
  patientsService: { listarPacientes: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

let id = 0
const plan = (
  id_paciente: number,
  nombre_paciente: string,
  estado: Planificacion["estado"],
  created_at: string
): Planificacion => {
  id += 1
  return {
    id_planificacion: id,
    id_paciente,
    nombre_paciente,
    nombre: `Plan ${id}`,
    descripcion: null,
    estado,
    fecha_inicio: null,
    fecha_fin: null,
    fecha_publicacion: null,
    created_at,
    cantidad_recetas: 20,
  }
}

const ANA = [
  plan(3, "Ana Pérez", "archivada", "2026-08-01T10:00:00"),
  plan(3, "Ana Pérez", "publicada", "2026-09-01T10:00:00"),
  plan(3, "Ana Pérez", "borrador", "2026-09-20T10:00:00"),
  plan(3, "Ana Pérez", "archivada", "2026-07-01T10:00:00"),
]
const LUIS = [plan(4, "Luis Gómez", "publicada", "2026-10-01T10:00:00")]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.list).mockResolvedValue([...ANA, ...LUIS])
  vi.mocked(mealPlansService.templates).mockResolvedValue([])
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
          </Routes>
        </ConfirmProvider>
      </GenerationsProvider>
    </MemoryRouter>
  )
}

it("agrupa por paciente: el más activo primero y los borradores arriba", () => {
  const grupos = agrupar_por_paciente([...ANA, ...LUIS])
  expect(grupos.map((g) => g.nombre_paciente)).toEqual([
    "Luis Gómez",
    "Ana Pérez",
  ])
  expect(grupos[1].planes.map((p) => p.estado)).toEqual([
    "borrador",
    "publicada",
    "archivada",
    "archivada",
  ])
  expect(iniciales("Ana Pérez")).toBe("AP")
  expect(iniciales("")).toBe("?")
})

it("muestra un bloque por paciente con sus planes, no todos mezclados", async () => {
  mount()
  const ana = await screen.findByRole("group", {
    name: "Planes de Ana Pérez",
  })
  expect(
    within(ana).getByText(/4 planes · 1 borrador · 1 publicado/)
  ).toBeTruthy()
  // Con todos a la vista, tres por paciente y un acceso al resto.
  expect(within(ana).getAllByRole("link", { name: /^Plan \d$/ })).toHaveLength(
    3
  )
  expect(
    within(ana).getByRole("button", { name: "Ver los 4 planes de Ana Pérez" })
  ).toBeTruthy()
  const luis = screen.getByRole("group", { name: "Planes de Luis Gómez" })
  expect(within(luis).getAllByRole("link", { name: /^Plan \d$/ })).toHaveLength(
    1
  )
})

it("filtra por paciente", async () => {
  const user = userEvent.setup()
  mount()
  await screen.findByRole("group", { name: "Planes de Ana Pérez" })
  await user.selectOptions(screen.getByLabelText("Paciente"), "4")
  expect(
    screen.queryByRole("group", { name: "Planes de Ana Pérez" })
  ).toBeNull()
  expect(
    screen.getByRole("group", { name: "Planes de Luis Gómez" })
  ).toBeTruthy()
  await user.selectOptions(screen.getByLabelText("Paciente"), "")
  expect(
    screen.getByRole("group", { name: "Planes de Ana Pérez" })
  ).toBeTruthy()
})

it("ver todos los planes de un paciente lo filtra", async () => {
  const user = userEvent.setup()
  mount()
  await user.click(
    await screen.findByRole("button", { name: "Ver los 4 planes de Ana Pérez" })
  )
  const ana = screen.getByRole("group", { name: "Planes de Ana Pérez" })
  expect(within(ana).getAllByRole("link", { name: /^Plan \d$/ })).toHaveLength(
    4
  )
  expect(
    screen.queryByRole("group", { name: "Planes de Luis Gómez" })
  ).toBeNull()
  expect((screen.getByLabelText("Paciente") as HTMLSelectElement).value).toBe(
    "3"
  )
})

it("lo que se está generando va en su propia sección con el nombre del paciente", async () => {
  vi.mocked(mealPlansService.activeGenerations).mockResolvedValue([
    {
      id_generacion: 9,
      id_paciente: 4,
      estado: "procesando",
      id_planificacion: null,
      nombre: "Semana nueva",
      error_codigo: null,
      error_mensaje: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])
  mount()
  const seccion = await screen.findByRole("region", { name: "En preparación" })
  const fila = within(seccion).getByRole("status", {
    name: "Generando Semana nueva",
  })
  expect(within(fila).getByText("Luis Gómez")).toBeTruthy()
})

it("sin nada generándose no hay sección de preparación", async () => {
  mount()
  await screen.findByRole("group", { name: "Planes de Ana Pérez" })
  expect(screen.queryByRole("region", { name: "En preparación" })).toBeNull()
})
