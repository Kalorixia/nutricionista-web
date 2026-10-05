import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PlanPdfDialog } from "@/components/modules/plans/PlanPdfDialog"
import { nutritionistService } from "@/services/nutritionist.service"
import * as plan_pdf from "@/utils/plan_pdf"
import { contenido_pdf, generar_pdf } from "@/utils/plan_pdf"
import type { PlanificacionDetalle } from "@/types/mealPlan"

vi.mock("@/services/nutritionist.service", () => ({
  nutritionistService: { estadoMatricula: vi.fn() },
}))

const receta: PlanificacionDetalle["recetas"][number]["receta"] = {
  id_receta: 2,
  nombre: "Arroz",
  descripcion: null,
  tiempo_preparacion: 20,
  porciones: 1,
  dificultad: null,
  calorias_por_porcion: 300,
  proteinas_g: null,
  carbohidratos_g: null,
  grasas_totales_g: null,
  estado_nutricional: "validada",
  imagen_url: null,
  publica: true,
  created_at: "2026-09-10T12:00:00",
  updated_at: null,
  categorias: [],
}
const PLAN: PlanificacionDetalle = {
  id_planificacion: 7,
  id_paciente: 3,
  nombre_paciente: "Ana Pérez",
  descripcion: null,
  fecha_publicacion: null,
  created_at: "2026-09-10T12:00:00",
  nombre: "Semana de Ana",
  estado: "publicada",
  fecha_inicio: "2026-10-05",
  fecha_fin: "2026-10-11",
  indicaciones_generales: "Tomá 2 litros de agua por día.",
  notas_comidas: { "Lunes|Cena": "Si llegás tarde, comé liviano." },
  objetivos_nutricionales: {
    get_objetivo_kcal: 1800.4,
    proteinas_g: 110,
    grasas_g: 60,
    carbohidratos_g: 205,
  },
  resumen_diario: [
    {
      dia_semana: "Lunes",
      completos: true,
      totales: {
        energia_kcal: 1234.6,
        proteinas_g: 1,
        carbohidratos_g: 1,
        grasas_totales_g: 1,
      },
      diferencia_objetivo: null,
    },
  ],
  recetas: [
    {
      id_planificacion_receta: 2,
      dia_semana: "Lunes",
      momento_comida: "Desayuno",
      orden: 2,
      receta: {
        ...receta,
        nombre: "Yogur natural",
        calorias_por_porcion: 95.6,
      },
    },
    {
      id_planificacion_receta: 1,
      dia_semana: "Lunes",
      momento_comida: "Desayuno",
      orden: 1,
      receta: { ...receta, nombre: "Avena con banana" },
    },
    {
      id_planificacion_receta: 3,
      dia_semana: "Miércoles",
      momento_comida: "Almuerzo",
      orden: 3,
      receta: { ...receta, nombre: "Pollo al horno" },
    },
  ],
}

const PROFESIONAL = { nombre: "Laura Díaz", matricula: "MN 1234" }

describe("Contenido del PDF", () => {
  it("lleva profesional, paciente, período, indicaciones, notas y sólo los días con comidas", () => {
    const contenido = contenido_pdf(PLAN, PROFESIONAL, {
      incluir_nutricion: false,
    })
    expect(contenido.borrador).toBe(false)
    expect(contenido.lineas_encabezado).toEqual([
      "Profesional: Laura Díaz · Matrícula MN 1234",
      "Paciente: Ana Pérez",
      "Del 5/10/2026 al 11/10/2026",
    ])
    expect(contenido.indicaciones).toBe("Tomá 2 litros de agua por día.")
    expect(contenido.dias.map((dia) => dia.dia)).toEqual(["Lunes", "Miércoles"])
    const lunes = contenido.dias[0]
    expect(lunes.comidas.map((comida) => comida.momento)).toEqual([
      "Desayuno",
      "Cena",
    ])
    expect(lunes.comidas[0].items.map((item) => item.nombre)).toEqual([
      "Avena con banana",
      "Yogur natural",
    ])
    expect(lunes.comidas[1]).toEqual({
      momento: "Cena",
      items: [],
      nota: "Si llegás tarde, comé liviano.",
    })
    expect(contenido.nombre_archivo).toBe("semana-de-ana-ana-perez.pdf")
  })

  it("sin calorías no muestra objetivo ni kcal; con calorías sí", () => {
    const sin = contenido_pdf(PLAN, PROFESIONAL, { incluir_nutricion: false })
    expect(sin.objetivo).toBeNull()
    expect(sin.dias[0].total_kcal).toBeNull()
    expect(sin.dias[0].comidas[0].items[1].kcal).toBeNull()

    const con = contenido_pdf(PLAN, PROFESIONAL, { incluir_nutricion: true })
    expect(con.objetivo).toBe(
      "Objetivo diario: 1800 kcal · proteínas 110 g · carbohidratos 205 g · grasas 60 g"
    )
    expect(con.dias[0].total_kcal).toBe(1235)
    expect(con.dias[0].comidas[0].items[1].kcal).toBe(96)
  })

  it("un borrador sale marcado y una plantilla sin paciente", () => {
    expect(
      contenido_pdf({ ...PLAN, estado: "borrador" }, PROFESIONAL, {
        incluir_nutricion: false,
      }).borrador
    ).toBe(true)
    const plantilla = contenido_pdf(
      { ...PLAN, es_plantilla: true, id_paciente: null },
      { nombre: "Laura Díaz", matricula: null },
      { incluir_nutricion: false }
    )
    expect(plantilla.lineas_encabezado.slice(0, 2)).toEqual([
      "Profesional: Laura Díaz",
      "Plantilla (sin paciente)",
    ])
  })

  it("genera un A4 con el texto del plan", async () => {
    const doc = await generar_pdf(
      contenido_pdf({ ...PLAN, estado: "borrador" }, PROFESIONAL, {
        incluir_nutricion: true,
      })
    )
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210)
    const crudo = doc.output()
    for (const texto of [
      "Semana de Ana",
      "BORRADOR",
      "Avena con banana",
      "Si llegás tarde",
      "Tomá 2 litros",
      "MN 1234",
    ])
      expect(crudo).toContain(texto)
  })
})

describe("Diálogo de descarga", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(nutritionistService.estadoMatricula).mockReset()
  })

  it("pide la matrícula y descarga con la opción elegida", async () => {
    const user = userEvent.setup()
    const descargar = vi.spyOn(plan_pdf, "descargar_pdf").mockResolvedValue()
    vi.mocked(nutritionistService.estadoMatricula).mockResolvedValue({
      matricula: "MN 1234",
    } as Awaited<ReturnType<typeof nutritionistService.estadoMatricula>>)
    const onClose = vi.fn()
    render(
      <PlanPdfDialog plan={{ ...PLAN, estado: "borrador" }} onClose={onClose} />
    )
    expect(screen.getByText(/Es un borrador/)).toBeTruthy()
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Descargar" }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const contenido = descargar.mock.calls[0][0]
    expect(contenido.incluir_nutricion).toBe(true)
    expect(contenido.lineas_encabezado[0]).toContain("MN 1234")
  })

  it("si la matrícula no responde, descarga igual sin ella", async () => {
    const user = userEvent.setup()
    const descargar = vi.spyOn(plan_pdf, "descargar_pdf").mockResolvedValue()
    vi.mocked(nutritionistService.estadoMatricula).mockRejectedValue(
      new Error("caído")
    )
    render(<PlanPdfDialog plan={PLAN} onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "Descargar" }))
    await waitFor(() => expect(descargar).toHaveBeenCalled())
    expect(descargar.mock.calls[0][0].lineas_encabezado[0]).not.toContain(
      "Matrícula"
    )
  })
})
