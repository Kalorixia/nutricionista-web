import { beforeEach, describe, expect, it, vi } from "vitest"
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
    parameters: vi.fn(),
    remove: vi.fn(),
    archive: vi.fn(),
    activeGenerations: vi.fn(),
    generationStatus: vi.fn(),
    templates: vi.fn(),
  },
}))
vi.mock("@/services/patients.service", () => ({
  patientsService: { listarPacientes: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const OPCIONES = {
  opciones_objetivo: [
    {
      id: 2,
      codigo: "aumentar_masa_muscular",
      nombre: "Aumentar masa muscular",
    },
    { id: 3, codigo: "mantener_peso", nombre: "Mantener el peso" },
  ],
  opciones_nivel_actividad: [
    { id: 1, nombre: "Sedentario" },
    { id: 3, nombre: "Moderado" },
  ],
}

const DEL_PACIENTE = {
  id_paciente: 3,
  objetivo: OPCIONES.opciones_objetivo[1],
  nivel_actividad: OPCIONES.opciones_nivel_actividad[1],
  objetivos: {
    get_objetivo_kcal: 2044.4,
    proteinas_g: 140,
    grasas_g: 56.8,
    carbohidratos_g: 243.3,
  },
  del_paciente: true,
  ...OPCIONES,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.parameters).mockResolvedValue(DEL_PACIENTE)
  vi.mocked(mealPlansService.list).mockResolvedValue([])
  vi.mocked(mealPlansService.templates).mockResolvedValue([])
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
  await user.click(
    await screen.findByRole("button", { name: "Eliminar Plan de prueba" })
  )
  expect(mealPlansService.remove).not.toHaveBeenCalled()
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Eliminar",
    })
  )
  await waitFor(() => expect(mealPlansService.remove).toHaveBeenCalledOnce())
  expect(screen.getByText("Plan de prueba")).toBeTruthy()
})

it("precarga los objetivos del paciente y los envía con el plan", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.create).mockResolvedValue({
    id_planificacion: 7,
  } as Awaited<ReturnType<typeof mealPlansService.create>>)
  mount()
  await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
  await user.selectOptions(screen.getByLabelText("Paciente"), "3")
  expect(await screen.findByDisplayValue("2044")).toBeTruthy()
  expect(mealPlansService.parameters).toHaveBeenCalledWith(3, {})
  await user.type(screen.getByLabelText("Nombre del plan"), "Semana")
  await user.click(screen.getByRole("button", { name: "Crear manual" }))
  await screen.findByText("Editor del borrador")
  expect(mealPlansService.create).toHaveBeenCalledWith(
    expect.objectContaining({
      id_objetivo: 3,
      id_nivel_actividad: 3,
      objetivos: {
        get_objetivo_kcal: 2044,
        proteinas_g: 140,
        grasas_g: 57,
        carbohidratos_g: 243,
      },
      guardar_como_prescripcion: false,
    })
  )
})

it("al cambiar el objetivo pide el recálculo al servidor", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.parameters)
    .mockResolvedValueOnce(DEL_PACIENTE)
    .mockResolvedValueOnce({
      ...DEL_PACIENTE,
      objetivo: OPCIONES.opciones_objetivo[0],
      objetivos: {
        get_objetivo_kcal: 2938.9,
        proteinas_g: 140,
        grasas_g: 81.6,
        carbohidratos_g: 411,
      },
      del_paciente: false,
    })
  mount()
  await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
  await user.selectOptions(screen.getByLabelText("Paciente"), "3")
  await screen.findByDisplayValue("2044")
  await user.selectOptions(screen.getByLabelText("Objetivo"), "2")
  expect(await screen.findByDisplayValue("2939")).toBeTruthy()
  expect(mealPlansService.parameters).toHaveBeenLastCalledWith(3, {
    id_objetivo: 2,
    id_nivel_actividad: 3,
  })
  expect(
    screen.getByRole("button", { name: /Volver a los del paciente/ })
  ).toBeTruthy()
})

it("completa los carbohidratos al cambiar la energía", async () => {
  const user = userEvent.setup()
  mount()
  await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
  await user.selectOptions(screen.getByLabelText("Paciente"), "3")
  const kcal = await screen.findByDisplayValue("2044")
  await user.clear(kcal)
  await user.type(kcal, "2444")
  // (2444 - 4*140 - 9*57) / 4 = 342.75
  expect(
    (screen.getByLabelText("Carbohidratos (g)") as HTMLInputElement).value
  ).toBe("343")
})

const generacion = {
  id_generacion: 12,
  id_paciente: 3,
  estado: "procesando" as const,
  id_planificacion: null,
  nombre: "Semana de octubre",
  error_codigo: null,
  error_mensaje: null,
  created_at: new Date(Date.now() - 65000).toISOString(),
  updated_at: new Date().toISOString(),
}

it("muestra en la lista el plan que se está generando, con paciente y tiempo", async () => {
  // La hora se fija acá y no al cargar el módulo: con la suite cargada, los
  // tests anteriores pueden tardar más que el margen del reloj.
  vi.mocked(mealPlansService.activeGenerations).mockResolvedValue([
    { ...generacion, created_at: new Date(Date.now() - 65000).toISOString() },
  ])
  mount()
  const fila = await screen.findByRole("status", {
    name: "Generando Semana de octubre",
  })
  expect(within(fila).getByText(/Ana Pérez/)).toBeTruthy()
  expect(
    within(fila).getByText(/El Copiloto está armando la semana/)
  ).toBeTruthy()
  expect(within(fila).getByText(/1:0\d/)).toBeTruthy()
  expect(screen.queryByText("Todavía no creaste ningún plan.")).toBeNull()
})

it("si la generación falla, queda en la lista con el motivo hasta descartarla", async () => {
  const user = userEvent.setup()
  vi.mocked(mealPlansService.activeGenerations)
    .mockResolvedValueOnce([generacion])
    .mockResolvedValue([])
  vi.mocked(mealPlansService.generationStatus).mockResolvedValue({
    ...generacion,
    estado: "fallida",
    error_mensaje: "El Copiloto alcanzó su límite de uso.",
  })
  mount()
  await screen.findByRole("status", { name: "Generando Semana de octubre" })
  expect(
    await screen.findByText(/alcanzó su límite de uso/, {}, { timeout: 6000 })
  ).toBeTruthy()
  await user.click(
    screen.getByRole("button", { name: "Descartar Semana de octubre" })
  )
  expect(screen.queryByText(/alcanzó su límite de uso/)).toBeNull()
}, 10000)

describe("Objetivo propio del plan (KAL-132-06)", () => {
  const MANTENIMIENTO = {
    get_objetivo_kcal: 2044.4,
    proteinas_g: 140,
    grasas_g: 56.8,
    carbohidratos_g: 243.3,
  }

  it("con Otro pide la referencia, la usa como base y envía el objetivo escrito", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.parameters)
      .mockResolvedValueOnce(DEL_PACIENTE)
      .mockResolvedValue({
        ...DEL_PACIENTE,
        objetivo: null,
        objetivo_personalizado: "otro",
        objetivos: null,
        mantenimiento: MANTENIMIENTO,
        del_paciente: false,
      })
    vi.mocked(mealPlansService.generate).mockResolvedValue({
      id_generacion: 1,
      id_paciente: 3,
      estado: "pendiente",
      id_planificacion: null,
      nombre: "Maratón",
      error_codigo: null,
      error_mensaje: null,
      created_at: "2026-10-05T12:00:00Z",
      updated_at: "2026-10-05T12:00:00Z",
    })
    mount()
    await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
    await user.selectOptions(screen.getByLabelText("Paciente"), "3")
    await screen.findByDisplayValue("2044")
    await user.selectOptions(screen.getByLabelText("Objetivo"), "otro")
    expect(mealPlansService.parameters).toHaveBeenLastCalledWith(3, {
      objetivo_personalizado: "otro",
      id_nivel_actividad: 3,
    })
    await screen.findByText(/Referencia de mantenimiento/)
    // Sin fórmula los números quedan vacíos hasta que el profesional decida.
    expect(
      (screen.getByLabelText("Energía (kcal/día)") as HTMLInputElement).value
    ).toBe("")
    await user.type(screen.getByLabelText("Nombre del plan"), "Maratón")

    await user.click(
      screen.getByRole("button", { name: "Generar con Copiloto" })
    )
    expect(
      screen.getByText("Escribí el objetivo del plan o elegí uno de la lista")
    ).toBeTruthy()
    expect(mealPlansService.generate).not.toHaveBeenCalled()

    await user.type(
      screen.getByLabelText("¿Cuál es el objetivo?"),
      "Preparación para una maratón"
    )
    await user.click(screen.getByRole("button", { name: "Usar como base" }))
    expect(
      (screen.getByLabelText("Energía (kcal/día)") as HTMLInputElement).value
    ).toBe("2044")
    await user.click(
      screen.getByRole("button", { name: "Generar con Copiloto" })
    )
    await waitFor(() => expect(mealPlansService.generate).toHaveBeenCalled())
    const enviado = vi.mocked(mealPlansService.generate).mock.calls[0][0]
    expect(enviado.objetivo_personalizado).toBe("Preparación para una maratón")
    expect(enviado.id_objetivo).toBeUndefined()
    expect(enviado.objetivos?.get_objetivo_kcal).toBe(2044)
  })

  it("si el paciente tiene un objetivo propio, el plan arranca con ese", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.parameters).mockResolvedValue({
      ...DEL_PACIENTE,
      objetivo: null,
      objetivo_personalizado: "Recomposición corporal",
    })
    mount()
    await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
    await user.selectOptions(screen.getByLabelText("Paciente"), "3")
    expect(
      await screen.findByDisplayValue("Recomposición corporal")
    ).toBeTruthy()
    expect((screen.getByLabelText("Objetivo") as HTMLSelectElement).value).toBe(
      "otro"
    )
  })

  it("las comidas se eligen con botones y no deja generar sin ninguna", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole("button", { name: "Nuevo plan" }))
    await user.selectOptions(screen.getByLabelText("Paciente"), "3")
    await user.type(screen.getByLabelText("Nombre del plan"), "Semana")
    for (const momento of ["Desayuno", "Almuerzo", "Merienda", "Cena"])
      await user.click(screen.getByRole("button", { name: momento }))
    expect(
      screen.getByRole("button", { name: "Cena" }).getAttribute("aria-pressed")
    ).toBe("false")
    await user.click(
      screen.getByRole("button", { name: "Generar con Copiloto" })
    )
    expect(
      screen.getByText("Elegí al menos una comida para el plan")
    ).toBeTruthy()
    expect(mealPlansService.generate).not.toHaveBeenCalled()
  })
})
