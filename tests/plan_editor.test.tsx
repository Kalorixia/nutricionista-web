import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import PlanEditor from "@/pages/PlanEditor"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import { mealPlansService } from "@/services/mealPlans.service"
import { recipesService } from "@/services/recipes.service"
import { ApiError } from "@/services/http"
import { review_summary } from "@/utils/plan_review"
import type { PlanificacionDetalle } from "@/types/mealPlan"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: {
    get: vi.fn(),
    publish: vi.fn(),
    addRecipe: vi.fn(),
    removeRecipe: vi.fn(),
  },
}))
vi.mock("@/services/recipes.service", () => ({
  recipesService: { list: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

export const plan: PlanificacionDetalle = {
  id_planificacion: 7,
  id_paciente: 3,
  nombre_paciente: "Ana Pérez",
  nombre: "Semana de Ana",
  descripcion: "Plan para revisar",
  estado: "borrador",
  fecha_inicio: null,
  fecha_fin: null,
  fecha_publicacion: null,
  created_at: "2026-09-10T12:00:00",
  recetas: [
    {
      id_planificacion_receta: 1,
      dia_semana: "Lunes",
      momento_comida: "Desayuno",
      orden: 1,
      receta: {
        id_receta: 2,
        nombre: "Arroz",
        descripcion: null,
        tiempo_preparacion: 20,
        porciones: 4,
        dificultad: null,
        calorias_por_porcion: 500,
        proteinas_g: null,
        carbohidratos_g: null,
        grasas_totales_g: null,
        estado_nutricional: "validada",
        imagen_url: "https://example.test/arroz.jpg",
        publica: true,
        created_at: "2026-09-10T12:00:00",
        updated_at: null,
        categorias: [],
      },
    },
  ],
}

function mount() {
  return render(
    <MemoryRouter initialEntries={["/planificacion/7"]}>
      <ConfirmProvider>
        <Routes>
          <Route path="/planificacion/:id" element={<PlanEditor />} />
        </Routes>
      </ConfirmProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.get).mockResolvedValue(structuredClone(plan))
})

describe("Revisión del plan", () => {
  it.each(["publicada", "archivada"] as const)(
    "muestra %s sin controles de edición",
    async (estado) => {
      vi.mocked(mealPlansService.get).mockResolvedValue({ ...plan, estado })
      mount()
      await screen.findByText("Este plan está en modo de sólo lectura.")
      expect(
        screen.queryByRole("button", { name: "Agregar receta" })
      ).toBeNull()
      expect(screen.queryByRole("button", { name: /Quitar Arroz/ })).toBeNull()
      expect(
        screen.queryByRole("button", { name: "Aprobar y publicar" })
      ).toBeNull()
    }
  )

  it("exige confirmación con resumen y permite cancelar", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(
      await screen.findByRole("button", { name: "Aprobar y publicar" })
    )
    const dialog = await screen.findByRole("dialog")
    expect(dialog.textContent).toContain("Ana Pérez")
    expect(dialog.textContent).toContain("1 ítem en 1 comida de la semana")
    expect(mealPlansService.publish).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))
    expect(mealPlansService.publish).not.toHaveBeenCalled()
  })

  it("colapsa el detalle extenso y mantiene las acciones fuera del área desplazable", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.get).mockResolvedValue({
      ...plan,
      generacion_ia: {
        modelo: "gemini-test",
        version_prompt: "test-v1",
        generado_en: "2026-09-12T12:00:00",
        sin_verificar: ["texto ".repeat(500)],
        advertencias: [],
      },
    })
    mount()
    await user.click(
      await screen.findByRole("button", { name: "Aprobar y publicar" })
    )
    const dialog = await screen.findByRole("dialog")
    const details = within(dialog)
      .getByText("Ver detalles de la revisión")
      .closest("details")
    expect(details?.hasAttribute("open")).toBe(false)
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" })
    ).toBeTruthy()
    expect(
      within(dialog).getByRole("button", { name: "Aprobar y publicar" })
    ).toBeTruthy()
  })

  it("publica una sola vez y pasa a sólo lectura", async () => {
    const user = userEvent.setup()
    let finish!: (value: PlanificacionDetalle) => void
    vi.mocked(mealPlansService.publish).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    mount()
    await user.click(
      await screen.findByRole("button", { name: "Aprobar y publicar" })
    )
    const dialog = await screen.findByRole("dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Aprobar y publicar" })
    )
    await waitFor(() =>
      expect(mealPlansService.publish).toHaveBeenCalledTimes(1)
    )
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Publicando…",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    finish({ ...plan, estado: "publicada" })
    await screen.findByText("Este plan está en modo de sólo lectura.")
  })

  it("conserva borrador y comidas cuando falla la publicación", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.publish).mockRejectedValue(
      new ApiError("Reintentá", 503)
    )
    mount()
    await user.click(
      await screen.findByRole("button", { name: "Aprobar y publicar" })
    )
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Aprobar y publicar",
      })
    )
    await waitFor(() =>
      expect(mealPlansService.publish).toHaveBeenCalledTimes(1)
    )
    expect(screen.getByText("Borrador")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /Quitar Arroz/, hidden: true })
    ).toBeTruthy()
  })

  it("no publica un borrador vacío", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.get).mockResolvedValue({ ...plan, recetas: [] })
    mount()
    await user.click(
      await screen.findByRole("button", { name: "Aprobar y publicar" })
    )
    expect(mealPlansService.publish).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("refleja una receta sólo después de guardarla y evita el doble envío", async () => {
    const user = userEvent.setup()
    vi.mocked(recipesService.list).mockResolvedValue({
      recetas: [plan.recetas[0].receta],
      total: 1,
      limit: 8,
      offset: 0,
    })
    let finish!: (value: PlanificacionDetalle) => void
    vi.mocked(mealPlansService.addRecipe).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    mount()
    await screen.findByText("Semana de Ana")
    await user.click(
      screen.getAllByRole("button", { name: "Agregar receta" })[1]
    )
    await user.type(
      screen.getByPlaceholderText("Buscar recetas o alimentos…"),
      "arroz"
    )
    const option = await screen.findByRole("button", { name: "Arroz" })
    await user.dblClick(option)
    expect(mealPlansService.addRecipe).toHaveBeenCalledTimes(1)
    finish({
      ...plan,
      recetas: [
        ...plan.recetas,
        {
          ...plan.recetas[0],
          id_planificacion_receta: 2,
          momento_comida: "Almuerzo",
        },
      ],
    })
    await screen.findByRole("button", {
      name: "Quitar Arroz de Lunes Almuerzo",
    })
  })

  it("no quita comidas si falla su eliminación", async () => {
    const user = userEvent.setup()
    vi.mocked(mealPlansService.removeRecipe).mockRejectedValue(
      new ApiError("Error", 503)
    )
    mount()
    await user.click(
      await screen.findByRole("button", { name: /Quitar Arroz/ })
    )
    expect(screen.getByRole("button", { name: /Quitar Arroz/ })).toBeTruthy()
  })

  it("distingue error recuperable de plan inexistente", async () => {
    vi.mocked(mealPlansService.get)
      .mockRejectedValueOnce(new ApiError("Sin conexión", 503))
      .mockResolvedValue(plan)
    const user = userEvent.setup()
    mount()
    await screen.findByText("Sin conexión")
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    await screen.findByText("Semana de Ana")
  })

  it("preserva y advierte comidas fuera de la grilla", () => {
    const summary = review_summary({
      ...plan,
      recetas: [{ ...plan.recetas[0], dia_semana: null }],
    })
    expect(summary.outside).toHaveLength(1)
    expect(summary.missing).toHaveLength(28)
  })
})

describe("Puntos sin verificar del Copiloto", () => {
  const generacion = {
    modelo: "gemini-3.1-pro-preview",
    version_prompt: "weekly-draft-v2",
    generado_en: "2026-09-12T12:00:00",
    sin_verificar: ["Detalle de «Diabetes»: «tipo 2, insulina nocturna»."],
    advertencias: ["Descarté dos recetas con azúcar agregada."],
  }

  it("los muestra separando lo no verificado de lo que revisó el modelo", async () => {
    vi.mocked(mealPlansService.get).mockResolvedValue({
      ...plan,
      generacion_ia: generacion,
    })
    mount()
    const aviso = await screen.findByRole("region", {
      name: "Puntos sin verificar del borrador",
    })
    expect(within(aviso).getByText(/insulina nocturna/)).toBeTruthy()
    expect(within(aviso).getByText(/azúcar agregada/)).toBeTruthy()
    expect(within(aviso).getByText(/sin verificar por el sistema/)).toBeTruthy()
  })

  it("muestra aparte lo que midió el sistema sobre el borrador", async () => {
    vi.mocked(mealPlansService.get).mockResolvedValue({
      ...plan,
      generacion_ia: {
        ...generacion,
        sin_verificar: [],
        advertencias: [],
        advertencias_sistema: [
          "Los días quedan en promedio ~600 kcal por debajo del objetivo (2400 kcal).",
        ],
      },
    })
    mount()
    const aviso = await screen.findByRole("region", {
      name: "Puntos sin verificar del borrador",
    })
    expect(within(aviso).getByText(/~600 kcal por debajo/)).toBeTruthy()
    expect(within(aviso).getByText(/calculado por el sistema/)).toBeTruthy()
  })

  it("no dibuja el aviso en un plan cargado a mano", async () => {
    mount()
    await screen.findByRole("button", { name: "Aprobar y publicar" })
    expect(
      screen.queryByRole("region", {
        name: "Puntos sin verificar del borrador",
      })
    ).toBeNull()
  })

  it("los conserva estructurados para el detalle de la confirmación", () => {
    const resumen = review_summary({ ...plan, generacion_ia: generacion })
    expect(resumen.unverified).toEqual(generacion.sin_verificar)
    expect(resumen.description).not.toContain("insulina nocturna")
  })
})

describe("Fotos y resumen de receta en la grilla", () => {
  it("muestra la foto de la comida y abre su resumen al tocarla", async () => {
    const user = userEvent.setup()
    mount()
    await screen.findByText("Semana de Ana")

    const foto = document.querySelector(
      'img[src="https://example.test/arroz.jpg"]'
    )
    expect(foto).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Ver Arroz" }))
    const resumen = await screen.findByRole("dialog")
    expect(within(resumen).getByText("Lunes · Desayuno")).toBeTruthy()
    expect(within(resumen).getByText(/20 min/)).toBeTruthy()
    expect(within(resumen).getByText(/Rinde 4/)).toBeTruthy()
    expect(
      within(resumen).getByRole("link", { name: "Ver la receta completa" })
    ).toHaveProperty("href", expect.stringContaining("/recetas/2"))
  })

  it("en un plan publicado no dibuja las comidas que ese paciente no hace", async () => {
    // El plan de prueba sólo tiene desayuno: las otras tres no deben aparecer.
    vi.mocked(mealPlansService.get).mockResolvedValue({
      ...plan,
      estado: "publicada",
    })
    mount()
    await screen.findByText("Este plan está en modo de sólo lectura.")
    expect(screen.queryAllByText("Merienda")).toHaveLength(0)
    expect(screen.queryAllByText("Desayuno").length).toBeGreaterThan(0)
  })
})
