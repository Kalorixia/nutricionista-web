import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdherenceCard } from "@/components/modules/patients/AdherenceCard"
import { mealPlansService } from "@/services/mealPlans.service"
import { fecha_corta, plan_por_defecto } from "@/utils/seguimiento"
import type { Planificacion, Seguimiento } from "@/types/mealPlan"

vi.mock("@/services/mealPlans.service", () => ({
  mealPlansService: { followUp: vi.fn() },
}))

const plan = (
  id: number,
  estado: Planificacion["estado"],
  fecha_publicacion: string | null
): Planificacion => ({
  id_planificacion: id,
  id_paciente: 3,
  nombre_paciente: "Ana Pérez",
  nombre: `Plan ${id}`,
  descripcion: null,
  estado,
  fecha_inicio: null,
  fecha_fin: null,
  fecha_publicacion,
  created_at: "2026-09-01T10:00:00",
  cantidad_recetas: 20,
})

const PLANES = [
  plan(1, "archivada", "2026-08-01T10:00:00"),
  plan(2, "publicada", "2026-09-28T10:00:00"),
  plan(3, "borrador", null),
]

const conteo = {
  esperadas: 8,
  cumplidas: 4,
  con_cambios: 2,
  no_cumplidas: 1,
  sin_registro: 1,
  porcentaje_cumplimiento: 50,
}

const SEGUIMIENTO: Seguimiento = {
  id_planificacion: 2,
  desde: "2026-09-28",
  hasta: "2026-10-05",
  ultima_fecha_registro: "2026-10-05",
  resumen: conteo,
  semanas: [
    { ...conteo, inicio: "2026-10-05", fin: "2026-10-11" },
    { ...conteo, inicio: "2026-09-28", fin: "2026-10-04" },
  ],
  dias: [
    {
      fecha: "2026-10-05",
      dia_semana: "Lunes",
      comidas: [
        {
          momento_comida: "Almuerzo",
          estado: "con_cambios",
          comentario: "Cambié el arroz",
          no_me_gustaron: [{ id_receta: 12, nombre: "Lentejas" }],
          items: [{ id_receta: 12, nombre: "Lentejas" }],
        },
        {
          momento_comida: "Cena",
          estado: null,
          comentario: null,
          no_me_gustaron: [],
          items: [{ id_receta: 13, nombre: "Pollo" }],
        },
      ],
    },
  ],
  no_me_gustaron: [{ id_receta: 12, nombre: "Lentejas", veces: 3 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mealPlansService.followUp).mockResolvedValue(SEGUIMIENTO)
})

it("elige el plan publicado más reciente y nunca un borrador", () => {
  expect(plan_por_defecto(PLANES)?.id_planificacion).toBe(2)
  expect(plan_por_defecto([PLANES[0], PLANES[2]])?.id_planificacion).toBe(1)
  expect(plan_por_defecto([PLANES[2]])).toBeNull()
})

it("formatea fechas sin correrse de día", () => {
  expect(fecha_corta("2026-10-05", false)).toBe("5/10")
  expect(fecha_corta("2026-10-05")).toMatch(/^lun 5\/10$/)
})

it("muestra cumplimiento, semanas, días y lo que no le gustó", async () => {
  render(<AdherenceCard planes={PLANES} />)
  expect(await screen.findByText(/de 8 comidas cumplidas/)).toBeTruthy()
  expect(mealPlansService.followUp).toHaveBeenCalledWith(2)
  expect(screen.getByText(/Último registro:/)).toBeTruthy()
  expect(screen.getByRole("list", { name: "No le gustó" }).textContent).toBe(
    "Lentejas ×3"
  )
  expect(
    within(screen.getByRole("list", { name: "Por semana" })).getAllByRole(
      "listitem"
    )
  ).toHaveLength(2)
  const dias = screen.getByRole("list", { name: "Por día" })
  expect(within(dias).getByText("Cena · sin registro")).toBeTruthy()
  expect(within(dias).getByText(/“Cambié el arroz”/)).toBeTruthy()
})

it("permite cambiar de plan, sin ofrecer borradores", async () => {
  const user = userEvent.setup()
  render(<AdherenceCard planes={PLANES} />)
  const selector = await screen.findByLabelText("Plan a seguir")
  expect(
    within(selector)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value)
  ).toEqual(["1", "2"])
  await user.selectOptions(selector, "1")
  expect(mealPlansService.followUp).toHaveBeenLastCalledWith(1)
})

it("sin planes publicados no se dibuja", () => {
  const { container } = render(<AdherenceCard planes={[PLANES[2]]} />)
  expect(container.innerHTML).toBe("")
  expect(mealPlansService.followUp).not.toHaveBeenCalled()
})

it("avisa si el paciente todavía no registró nada", async () => {
  vi.mocked(mealPlansService.followUp).mockResolvedValue({
    ...SEGUIMIENTO,
    ultima_fecha_registro: null,
    no_me_gustaron: [],
  })
  render(<AdherenceCard planes={PLANES} />)
  expect(
    await screen.findByText(/El paciente todavía no registró comidas/)
  ).toBeTruthy()
})
