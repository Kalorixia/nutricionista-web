import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RequirementsCard } from "@/components/modules/patients/RequirementsCard"
import type {
  CalculoNutricional,
  Medicion,
  RequerimientoNutricional,
} from "@/types/patient"

const CALCULO: CalculoNutricional = {
  version: "mifflin-v1",
  edad: 30,
  tmb_kcal: 1648.75,
  get_kcal: 2555.56,
  get_objetivo_kcal: 2044.45,
  proteinas_g: 140,
  grasas_g: 56.79,
  carbohidratos_g: 243.33,
  hidratacion_ml: 2450,
  prescrito_por_profesional: [],
  calculado: {},
}

const MEDICIONES: Medicion[] = [
  {
    id_medicion: 31,
    peso_kg: 72.4,
    altura_cm: 168,
    fecha_medicion: "2026-09-15",
    created_at: "2026-09-15T13:42:00Z",
    cargada_por: "paciente",
  },
]

function requerimiento(
  id: number,
  extra: Partial<RequerimientoNutricional> = {}
): RequerimientoNutricional {
  return {
    id_requerimiento: id,
    resultado: CALCULO,
    calculo: CALCULO,
    objetivo_prescrito: null,
    version_calculo: "mifflin-v1",
    id_medicion: 31,
    objetivo: { id: 1, codigo: "bajar_peso", nombre: "Bajar de peso" },
    objetivo_personalizado: null,
    nivel_actividad: { id: 2, nombre: "moderado" },
    created_at: "2026-09-15T13:42:00Z",
    originado_por: "paciente",
    ...extra,
  }
}

const PRESCRITO = requerimiento(9, {
  resultado: {
    ...CALCULO,
    get_objetivo_kcal: 2400,
    prescrito_por_profesional: ["get_objetivo_kcal"],
    calculado: { get_objetivo_kcal: 2044.45 },
  },
  objetivo_prescrito: { get_objetivo_kcal: 2400 },
  originado_por: "nutricionista",
  created_at: "2026-09-20T13:42:00Z",
})

function renderizar(
  props: Partial<Parameters<typeof RequirementsCard>[0]> = {}
) {
  const onReintentar = vi.fn()
  render(
    <RequirementsCard
      requerimientos={[requerimiento(8), PRESCRITO]}
      mediciones={MEDICIONES}
      error={null}
      onReintentar={onReintentar}
      {...props}
    />
  )
  return { onReintentar }
}

function versiones() {
  const lista = screen.getByRole("list", {
    name: "Historial de requerimientos",
  })
  return within(lista).getAllByRole("listitem")
}

describe("Tarjeta de requerimientos nutricionales", () => {
  it("va de la más reciente a la más antigua, con la vigente marcada", () => {
    renderizar()
    const [primera, segunda] = versiones()
    expect(primera.textContent).toContain("Prescrito")
    expect(primera.textContent).toContain("Vigente")
    expect(segunda.textContent).toContain("Calculado")
    expect(segunda.textContent).not.toContain("Vigente")
    expect(screen.getAllByText("Vigente")).toHaveLength(1)
  })

  it("muestra el resultado redondeado y, si se prescribió, lo que daba la fórmula", () => {
    renderizar()
    const [prescrita, calculada] = versiones()
    expect(prescrita.textContent).toContain(
      "2400 kcal · Proteínas 140 g · Carbohidratos 243 g · Grasas 57 g"
    )
    expect(prescrita.textContent).toContain("la fórmula daba 2044 kcal")
    expect(calculada.textContent).toContain(
      "2044 kcal · Proteínas 140 g · Carbohidratos 243 g · Grasas 57 g"
    )
    expect(calculada.textContent).not.toContain("la fórmula daba")
  })

  it("muestra el origen: medición, objetivo y actividad", () => {
    renderizar({
      requerimientos: [
        requerimiento(8),
        requerimiento(10, {
          id_medicion: 99,
          objetivo: null,
          objetivo_personalizado: "Correr una maratón",
        }),
      ],
    })
    const [baja, encontrada] = versiones()
    expect(encontrada.textContent).toContain(
      "Medición del 15/9/2026: 72.4 kg · 168 cm"
    )
    expect(encontrada.textContent).toContain("Objetivo: Bajar de peso")
    expect(encontrada.textContent).toContain("Actividad: moderado")
    expect(baja.textContent).toContain("Medición dada de baja")
    expect(baja.textContent).toContain("Objetivo: Otro: Correr una maratón")
  })

  it("sin las mediciones, el origen dice que no está disponible", () => {
    renderizar({ requerimientos: [requerimiento(8)], mediciones: null })
    expect(versiones()[0].textContent).toContain("Medición no disponible")
  })

  it("dice quién originó cada versión", () => {
    renderizar({
      requerimientos: [
        requerimiento(1, { originado_por: null }),
        requerimiento(2, { originado_por: "paciente" }),
        requerimiento(3, { originado_por: "nutricionista" }),
      ],
    })
    const [tercera, segunda, primera] = versiones()
    expect(tercera.textContent).toContain("Nutricionista")
    expect(segunda.textContent).toContain("Paciente")
    expect(primera.textContent).toContain("Automático")
  })

  it("sin versiones lo dice", () => {
    renderizar({ requerimientos: [] })
    expect(
      screen.getByText("Todavía no hay requerimientos calculados.")
    ).toBeTruthy()
  })

  it("con un error de carga ofrece reintentar", async () => {
    const user = userEvent.setup()
    const { onReintentar } = renderizar({
      requerimientos: null,
      error: "No pudimos cargar los requerimientos",
    })
    const alerta = screen.getByRole("alert")
    expect(alerta.textContent).toContain("No pudimos cargar los requerimientos")
    await user.click(within(alerta).getByRole("button", { name: "Reintentar" }))
    expect(onReintentar).toHaveBeenCalledOnce()
  })

  it("muestra las 10 más recientes y deja ver todas", async () => {
    const user = userEvent.setup()
    renderizar({
      requerimientos: Array.from({ length: 12 }, (_, i) =>
        requerimiento(i + 1)
      ),
    })
    expect(versiones()).toHaveLength(10)
    await user.click(
      screen.getByRole("button", { name: "Ver los 12 requerimientos" })
    )
    expect(versiones()).toHaveLength(12)
  })
})
